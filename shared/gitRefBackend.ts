import * as yaml from 'js-yaml';
import type { CommentBackend, CommentStorageKey } from './commentStorage';
import type { CommentsFile, InlineComment, PageComment, Reply } from './types';

export const ORPHAN_REF_NAME = 'refs/md-comments/data';

export function commentsFilePathForMarkdown(filePath: string): string {
  if (filePath.endsWith('.comments.yml')) return filePath;
  return filePath.replace(/\.md$/i, '') + '.comments.yml';
}

function decodeBase64(base64Str: string): string {
  if (typeof atob === 'function') {
    return atob(base64Str.replace(/\s/g, ''));
  }
  return Buffer.from(base64Str.replace(/\s/g, ''), 'base64').toString('utf-8');
}

export function mergeCommentsFiles(local: CommentsFile, remote: CommentsFile): CommentsFile {
  const inlineMap = new Map<string, InlineComment>();
  for (const c of remote.inline_comments || []) {
    inlineMap.set(c.id, c);
  }
  for (const c of local.inline_comments || []) {
    const existing = inlineMap.get(c.id);
    if (!existing) {
      inlineMap.set(c.id, c);
    } else {
      const replyMap = new Map<string, Reply>();
      for (const r of existing.replies || []) {
        replyMap.set(r.id, r);
      }
      for (const r of c.replies || []) {
        replyMap.set(r.id, r);
      }
      inlineMap.set(c.id, {
        ...existing,
        ...c,
        replies: Array.from(replyMap.values()),
      });
    }
  }

  const pageMap = new Map<string, PageComment>();
  for (const c of remote.page_comments || []) {
    pageMap.set(c.id, c);
  }
  for (const c of local.page_comments || []) {
    const existing = pageMap.get(c.id);
    if (!existing) {
      pageMap.set(c.id, c);
    } else {
      const replyMap = new Map<string, Reply>();
      for (const r of existing.replies || []) {
        replyMap.set(r.id, r);
      }
      for (const r of c.replies || []) {
        replyMap.set(r.id, r);
      }
      pageMap.set(c.id, {
        ...existing,
        ...c,
        replies: Array.from(replyMap.values()),
      });
    }
  }

  return {
    inline_comments: Array.from(inlineMap.values()),
    page_comments: Array.from(pageMap.values()),
  };
}

export class GitHubOrphanRefBackend implements CommentBackend {
  constructor(private getToken: () => Promise<string | null> | string | null) {}

  private async fetchApi(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const method = options.method || 'GET';
    const fetchOptions: any = { ...options, headers };
    if (method.toUpperCase() === 'GET') {
      fetchOptions.cache = 'no-store';
      const connector = url.includes('?') ? '&' : '?';
      url = `${url}${connector}t=${Date.now()}`;
    }
    return fetch(url, fetchOptions);
  }

  /**
   * Reads all comments for a file from the orphan ref refs/md-comments/data.
   * If not found, falls back to checking file rename history via GitHub Commits API.
   */
  async read(key: CommentStorageKey): Promise<CommentsFile> {
    const commentsPath = commentsFilePathForMarkdown(key.filePath);
    const contentUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/contents/${commentsPath}?ref=${ORPHAN_REF_NAME}`;

    try {
      const res = await this.fetchApi(contentUrl);
      if (res.ok) {
        const data = (await res.json()) as { content?: string; encoding?: string };
        if (data.content) {
          const rawText = data.encoding === 'base64' ? decodeBase64(data.content) : data.content;
          const parsed = (yaml.load(rawText) as Partial<CommentsFile>) || {};
          return {
            inline_comments: parsed.inline_comments || [],
            page_comments: parsed.page_comments || [],
          };
        }
      }
    } catch {
      /* ignore and try rename fallback */
    }

    // Strategy 1: Rename trace fallback via GitHub Commits API
    const traceResult = await this.traceAndMigrateRename(key);
    if (traceResult) {
      return traceResult;
    }

    return { page_comments: [], inline_comments: [] };
  }

  /**
   * Checks GitHub commit history for renamed file events and migrates comments from the old path if found.
   */
  private async traceAndMigrateRename(key: CommentStorageKey): Promise<CommentsFile | null> {
    try {
      const commitsUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/commits?path=${encodeURIComponent(key.filePath)}&per_page=5`;
      const res = await this.fetchApi(commitsUrl);
      if (!res.ok) return null;

      const commits = (await res.json()) as Array<{ sha: string }>;
      for (const c of commits) {
        const commitDetailUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/commits/${c.sha}`;
        const detailRes = await this.fetchApi(commitDetailUrl);
        if (!detailRes.ok) continue;

        const detail = (await detailRes.json()) as {
          files?: Array<{ filename: string; previous_filename?: string; status?: string }>;
        };

        const renamedFile = detail.files?.find(
          (f) => f.filename === key.filePath && f.status === 'renamed' && f.previous_filename
        );

        if (renamedFile?.previous_filename) {
          const oldCommentsPath = commentsFilePathForMarkdown(renamedFile.previous_filename);
          const oldContentUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/contents/${oldCommentsPath}?ref=${ORPHAN_REF_NAME}`;
          const oldRes = await this.fetchApi(oldContentUrl);

          if (oldRes.ok) {
            const oldData = (await oldRes.json()) as { content?: string; encoding?: string };
            if (oldData.content) {
              const rawText =
                oldData.encoding === 'base64' ? decodeBase64(oldData.content) : oldData.content;
              const parsed = (yaml.load(rawText) as Partial<CommentsFile>) || {};
              const commentsFile: CommentsFile = {
                inline_comments: parsed.inline_comments || [],
                page_comments: parsed.page_comments || [],
              };

              // Automatically migrate in the orphan ref: write to new path, delete old path
              await this.write(key, commentsFile);
              await this.deleteFileFromRef(key.owner, key.repo, oldCommentsPath);
              return commentsFile;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[md-comments] Error tracing file rename history:', e);
    }
    return null;
  }

  /**
   * Deletes a file entry from the orphan ref.
   */
  private async deleteFileFromRef(
    owner: string,
    repo: string,
    pathToDelete: string
  ): Promise<void> {
    try {
      const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/md-comments/data`;
      const refRes = await this.fetchApi(refUrl);
      if (!refRes.ok) return;
      const refData = (await refRes.json()) as { object: { sha: string } };
      const currentCommitSha = refData.object.sha;

      const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`;
      const commitRes = await this.fetchApi(commitUrl);
      if (!commitRes.ok) return;
      const commitData = (await commitRes.json()) as { tree: { sha: string } };
      const currentTreeSha = commitData.tree.sha;

      const newTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;
      const newTreeRes = await this.fetchApi(newTreeUrl, {
        method: 'POST',
        body: JSON.stringify({
          base_tree: currentTreeSha,
          tree: [{ path: pathToDelete, mode: '100644', type: 'blob', sha: null }],
        }),
      });
      if (!newTreeRes.ok) return;
      const newTreeData = (await newTreeRes.json()) as { sha: string };

      const newCommitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;
      const newCommitRes = await this.fetchApi(newCommitUrl, {
        method: 'POST',
        body: JSON.stringify({
          message: `Migrate comments: delete ${pathToDelete}`,
          tree: newTreeData.sha,
          parents: [currentCommitSha],
        }),
      });
      if (!newCommitRes.ok) return;
      const newCommitData = (await newCommitRes.json()) as { sha: string };

      await this.fetchApi(refUrl, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommitData.sha, force: false }),
      });
    } catch (e) {
      console.warn('[md-comments] Error deleting old comment path from orphan ref:', e);
    }
  }

  /**
   * Writes comments to the orphan ref using compare-and-swap (CAS) retry logic.
   */
  async write(key: CommentStorageKey, data: CommentsFile): Promise<void> {
    const commentsPath = commentsFilePathForMarkdown(key.filePath);
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await this.tryWriteCommit(key, commentsPath, data);
        if (success) return;
      } catch (err: any) {
        if (attempt === maxRetries) {
          throw new Error(
            `Failed to write comments to orphan ref after ${maxRetries} attempts: ${err?.message || err}`
          );
        }
      }
      await new Promise((r) => setTimeout(r, 100 * attempt));
    }
  }

  private async tryWriteCommit(
    key: CommentStorageKey,
    commentsPath: string,
    newData: CommentsFile
  ): Promise<boolean> {
    const refUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/git/refs/md-comments/data`;
    const refRes = await this.fetchApi(refUrl);

    let currentCommitSha: string | null = null;
    if (refRes.ok) {
      const refData = (await refRes.json()) as { object: { sha: string } };
      currentCommitSha = refData.object.sha;
    }

    const yamlString = yaml.dump(newData, { indent: 2, lineWidth: -1 });

    // Create tree directly with inline content blob and base_tree
    const treeUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/git/trees`;
    const treeBody: Record<string, unknown> = {
      tree: [{ path: commentsPath, mode: '100644', type: 'blob', content: yamlString }],
    };
    if (currentCommitSha) {
      treeBody.base_tree = currentCommitSha;
    }
    const treeRes = await this.fetchApi(treeUrl, {
      method: 'POST',
      body: JSON.stringify(treeBody),
    });
    if (!treeRes.ok) throw new Error(`Tree creation failed: ${treeRes.status}`);
    const treeData = (await treeRes.json()) as { sha: string };

    // Create commit
    const commitUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/git/commits`;
    const commitBody: Record<string, unknown> = {
      message: `Update comments for ${key.filePath}`,
      tree: treeData.sha,
    };
    if (currentCommitSha) {
      commitBody.parents = [currentCommitSha];
    }
    const commitRes = await this.fetchApi(commitUrl, {
      method: 'POST',
      body: JSON.stringify(commitBody),
    });
    if (!commitRes.ok) throw new Error(`Commit creation failed: ${commitRes.status}`);
    const createdCommitData = (await commitRes.json()) as { sha: string };

    // Update or Create Ref
    if (currentCommitSha) {
      const patchRefRes = await this.fetchApi(refUrl, {
        method: 'PATCH',
        body: JSON.stringify({ sha: createdCommitData.sha, force: false }),
      });
      if (patchRefRes.ok) return true;
      if (patchRefRes.status === 422) {
        return false;
      }
      throw new Error(`Ref update failed: ${patchRefRes.status}`);
    } else {
      const createRefUrl = `https://api.github.com/repos/${key.owner}/${key.repo}/git/refs`;
      const createRefRes = await this.fetchApi(createRefUrl, {
        method: 'POST',
        body: JSON.stringify({ ref: ORPHAN_REF_NAME, sha: createdCommitData.sha }),
      });
      if (createRefRes.ok) return true;
      if (createRefRes.status === 422) {
        return false;
      }
      throw new Error(`Ref creation failed: ${createRefRes.status}`);
    }
  }
}
