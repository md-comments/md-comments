import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as yaml from 'js-yaml';
import {
  GitHubOrphanRefBackend,
  commentsFilePathForMarkdown,
  mergeCommentsFiles,
  decodeBase64,
  ORPHAN_REF_NAME,
} from '../shared/gitRefBackend';
import type { CommentsFile } from '../shared/types';

describe('GitHubOrphanRefBackend', () => {
  describe('decodeBase64', () => {
    it('uses browser atob and TextDecoder fallback when Buffer is undefined', () => {
      const origBuffer = globalThis.Buffer;
      try {
        (globalThis as any).Buffer = undefined;
        const text = 'Hello world from browser atob fallback 🚀';
        const base64 = btoa(unescape(encodeURIComponent(text)));
        expect(decodeBase64(base64)).toBe(text);
      } finally {
        globalThis.Buffer = origBuffer;
      }
    });
  });

  describe('commentsFilePathForMarkdown', () => {
    it('converts .md extensions to clean .comments.yml path if commitHash is unprovided or 0000000', () => {
      expect(commentsFilePathForMarkdown('README.md')).toBe('README.comments.yml');
      expect(commentsFilePathForMarkdown('docs/intro.md')).toBe('docs/intro.comments.yml');
      expect(commentsFilePathForMarkdown('README.md', '0000000')).toBe('README.comments.yml');
    });

    it('formats path with 7-character short commit SHA when commitHash is provided', () => {
      expect(commentsFilePathForMarkdown('README.md', 'a1b2c3d4e5f6789')).toBe(
        'README.a1b2c3d.comments.yml'
      );
      expect(commentsFilePathForMarkdown('docs/intro.md', '7f8e9d0')).toBe(
        'docs/intro.7f8e9d0.comments.yml'
      );
    });

    it('updates existing .comments.yml paths with commit hash', () => {
      expect(commentsFilePathForMarkdown('docs/intro.comments.yml')).toBe(
        'docs/intro.comments.yml'
      );
      expect(commentsFilePathForMarkdown('docs/intro.comments.yml', 'a1b2c3d')).toBe(
        'docs/intro.a1b2c3d.comments.yml'
      );
    });
  });

  describe('mergeCommentsFiles', () => {
    it('unions inline and page comments by ID without duplicates', () => {
      const local: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: 'Intro',
            body: 'Local body',
            created_at: '2026-08-04T12:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const remote: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: 'Intro',
            body: 'Remote body',
            created_at: '2026-08-04T12:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r1',
                author: 'bob',
                body: 'Remote reply',
                created_at: '2026-08-04T12:05:00Z',
                reactions: [],
              },
            ],
          },
          {
            id: 'c2',
            author: 'charlie',
            anchor_text: 'world',
            anchor_hash: 'h2',
            paragraph_index: 1,
            heading_context: 'Intro',
            body: 'Comment 2',
            created_at: '2026-08-04T12:10:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const merged = mergeCommentsFiles(local, remote);
      expect(merged.inline_comments.length).toBe(2);
      expect(merged.inline_comments.find((c) => c.id === 'c1')?.replies.length).toBe(1);
      expect(merged.inline_comments.find((c) => c.id === 'c2')?.body).toBe('Comment 2');
    });

    it('merges new local inline comments, local replies, and overlapping page comments with replies', () => {
      const local: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Updated local body',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r-local',
                author: 'alice',
                body: 'Local reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
          {
            id: 'c-brand-new',
            author: 'david',
            anchor_text: 'new section',
            anchor_hash: 'h3',
            paragraph_index: 2,
            heading_context: '',
            body: 'Brand new local comment',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [
          {
            id: 'p1',
            author: 'alice',
            body: 'Page comment edited locally',
            created_at: '',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr-local',
                author: 'alice',
                body: 'Local page reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
        ],
      };

      const remote: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Old body',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r-remote',
                author: 'bob',
                body: 'Remote reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [
          {
            id: 'p1',
            author: 'alice',
            body: 'Original page comment',
            created_at: '',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr-remote',
                author: 'bob',
                body: 'Remote page reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
        ],
      };

      const merged = mergeCommentsFiles(local, remote);
      expect(merged.inline_comments).toHaveLength(2);
      expect(merged.inline_comments.find((c) => c.id === 'c-brand-new')).toBeDefined();
      expect(merged.inline_comments.find((c) => c.id === 'c1')?.replies).toHaveLength(2);

      expect(merged.page_comments).toHaveLength(1);
      expect(merged.page_comments[0].replies).toHaveLength(2);
      expect(merged.page_comments[0].body).toBe('Page comment edited locally');
    });

    it('omits comments and replies specified in deletedIds', () => {
      const local: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Comment 1',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const remote: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Comment 1',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r1',
                author: 'bob',
                body: 'Reply 1',
                created_at: '',
                reactions: [],
              },
            ],
          },
          {
            id: 'c2',
            author: 'bob',
            anchor_text: 'world',
            anchor_hash: 'h2',
            paragraph_index: 1,
            heading_context: '',
            body: 'Comment 2 to delete',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const merged = mergeCommentsFiles(local, remote, new Set(['c2', 'r1']));
      expect(merged.inline_comments.length).toBe(1);
      expect(merged.inline_comments[0].id).toBe('c1');
      expect(merged.inline_comments[0].replies.length).toBe(0);
    });
  });

  describe('read and write methods', () => {
    let backend: GitHubOrphanRefBackend;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      backend = new GitHubOrphanRefBackend(() => 'fake-token');
    });

    it('returns empty CommentsFile when ref or content does not exist', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      }); // read content
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      }); // rename trace commits

      const result = await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'docs/test.md',
      });

      expect(result).toEqual({ page_comments: [], inline_comments: [] });
    });

    it('reads and decodes YAML content with multi-byte UTF-8 emojis from base64', async () => {
      const mockComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p1',
            author: 'user1',
            body: 'Emoji test 👍 👀 ❤️ 🎉 ❓',
            created_at: '2026-08-04T10:00:00Z',
            resolved: false,
            reactions: [{ emoji: '👍', users: ['user1'] }],
            replies: [],
          },
        ],
      };
      const yamlStr = yaml.dump(mockComments);
      const base64Content = Buffer.from(yamlStr).toString('base64');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: base64Content, encoding: 'base64' }),
      });

      const result = await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'README.md',
      });

      expect(result.page_comments.length).toBe(1);
      expect(result.page_comments[0].body).toBe('Emoji test 👍 👀 ❤️ 🎉 ❓');
      expect(result.page_comments[0].reactions[0].emoji).toBe('👍');
    });

    it('creates a new orphan ref when writing for the first time', async () => {
      // 1. GET ref -> 404 (ref doesn't exist)
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      // 2. POST tree -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'tree-sha' }) });
      // 3. POST commit -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'commit-sha' }) });
      // 4. POST ref -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ref: ORPHAN_REF_NAME }) });

      await backend.write(
        { owner: 'owner', repo: 'repo', filePath: 'docs/new.md' },
        { inline_comments: [], page_comments: [] }
      );

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('retries write on 422 CAS conflict and succeeds on second attempt', async () => {
      // Attempt 1:
      // GET ref -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c1' } }) });
      // POST tree -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 't2' }) });
      // POST commit -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'c2' }) });
      // PATCH ref -> 422 conflict!
      fetchMock.mockResolvedValueOnce({ ok: false, status: 422 });

      // Retry read attempt:
      // GET content targetPath (which is also legacyPath since no commitHash provided) -> 404
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      // GET commits for rename trace -> 404
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

      // Attempt 2:
      // GET ref -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'c2-new' } }),
      });
      // POST tree -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 't3' }) });
      // POST commit -> ok
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'c3' }) });
      // PATCH ref -> 200 OK
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c3' } }) });

      await backend.write(
        { owner: 'owner', repo: 'repo', filePath: 'docs/test.md' },
        { inline_comments: [], page_comments: [] }
      );

      expect(fetchMock.mock.calls.length).toBe(10);
    });

    it('merges comments from commit-hashed file and legacy un-hashed file on read and deletes legacy file', async () => {
      const legacyComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p-legacy',
            author: 'bob',
            body: 'Comment from legacy base file',
            created_at: '2026-08-25T12:00:00Z',
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      const base64Legacy = Buffer.from(yaml.dump(legacyComments)).toString('base64');

      // 1. Fetch target commit-hashed file (docs/test.a1b2c3d.comments.yml) -> 404 (not yet migrated)
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      // 2. Fetch legacy file (docs/test.comments.yml) -> 200 (found)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: base64Legacy, encoding: 'base64' }),
      });

      // Mocks for write call during migration:
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c1' } }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 't1' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'c2' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c2' } }) });

      // Mocks for deleteFileFromRef call during cleanup:
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c2' } }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ tree: { sha: 't2' } }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 't3' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'c3' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c3' } }) });

      const result = await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'docs/test.md',
        commitHash: 'a1b2c3d4e5f',
      });

      expect(result.page_comments.length).toBe(1);
      expect(result.page_comments[0].id).toBe('p-legacy');
    });

    it('deletes legacy comments file without resurrecting comments when targetComments already exists', async () => {
      const commitComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p-commit',
            author: 'alice',
            body: 'Active commit comment',
            created_at: '2026-09-01T10:00:00Z',
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };
      const legacyComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p-deleted-in-commit',
            author: 'bob',
            body: 'Old deleted comment in legacy',
            created_at: '2026-08-25T10:00:00Z',
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      const base64Commit = Buffer.from(yaml.dump(commitComments)).toString('base64');
      const base64Legacy = Buffer.from(yaml.dump(legacyComments)).toString('base64');

      // 1. Fetch target commit-hashed file -> 200 (found)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: base64Commit, encoding: 'base64' }),
      });
      // 2. Fetch legacy file -> 200 (found)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: base64Legacy, encoding: 'base64' }),
      });

      // Mocks for deleteFileFromRef call during cleanup of legacy file:
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c2' } }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ tree: { sha: 't2' } }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 't3' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'c3' }) });
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: 'c3' } }) });

      const result = await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'docs/test.md',
        commitHash: 'a1b2c3d4e5f',
      });

      // Crucial: Must only have the active comment, NOT the deleted comment from legacy!
      expect(result.page_comments.length).toBe(1);
      expect(result.page_comments[0].id).toBe('p-commit');
    });

    it('preserves deletions during CAS write retries without resurrecting deleted comments', async () => {
      const prevComments: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'To be deleted',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r-deleted-with-c1',
                author: 'bob',
                body: 'Reply deleted with parent',
                created_at: '',
                reactions: [],
              },
            ],
          },
          {
            id: 'c2',
            author: 'alice',
            anchor_text: 'world',
            anchor_hash: 'h2',
            paragraph_index: 1,
            heading_context: '',
            body: 'Kept comment',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r1',
                author: 'bob',
                body: 'Kept reply',
                created_at: '',
                reactions: [],
              },
              {
                id: 'r2',
                author: 'charlie',
                body: 'Deleted reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [
          {
            id: 'p1',
            author: 'dave',
            body: 'To be deleted page comment',
            created_at: '',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr-deleted-with-p1',
                author: 'eve',
                body: 'Page reply deleted with parent',
                created_at: '',
                reactions: [],
              },
            ],
          },
          {
            id: 'p2',
            author: 'frank',
            body: 'Kept page comment',
            created_at: '',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr1',
                author: 'grace',
                body: 'Kept page reply',
                created_at: '',
                reactions: [],
              },
              {
                id: 'pr2',
                author: 'heidi',
                body: 'Deleted page reply',
                created_at: '',
                reactions: [],
              },
            ],
          },
        ],
      };

      // Current data has c1 removed, c2 kept with r1 (r2 removed);
      // p1 removed, p2 kept with pr1 (pr2 removed)
      const currentComments: CommentsFile = {
        inline_comments: [
          {
            ...prevComments.inline_comments[1],
            replies: [prevComments.inline_comments[1].replies![0]],
          },
        ],
        page_comments: [
          {
            ...prevComments.page_comments[1],
            replies: [prevComments.page_comments[1].replies![0]],
          },
        ],
      };

      let writtenDataText = '';

      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        const method = (opts?.method || 'GET').toUpperCase();
        // 1st attempt: tryWriteCommit conflicts on patch ref
        if (url.includes('/git/refs/md-comments/data') && method === 'GET') {
          return { ok: true, json: async () => ({ object: { sha: 'parent-sha' } }) };
        }
        if (url.includes('/git/blobs')) {
          writtenDataText = JSON.parse(opts.body).content;
          return { ok: true, json: async () => ({ sha: 'blob-sha' }) };
        }
        if (url.includes('/git/commits/parent-sha')) {
          return { ok: true, json: async () => ({ tree: { sha: 'tree-parent' } }) };
        }
        if (url.includes('/git/trees')) {
          const body = JSON.parse(opts.body);
          if (body.tree?.[0]?.content) {
            writtenDataText = body.tree[0].content;
          }
          return { ok: true, json: async () => ({ sha: 'new-tree' }) };
        }
        if (url.includes('/git/commits') && method === 'POST') {
          return { ok: true, json: async () => ({ sha: 'new-commit-sha' }) };
        }
        if (url.includes('/git/refs/md-comments/data') && method === 'PATCH') {
          // Fail 1st attempt with 422 CAS conflict, succeed 2nd attempt
          if (!fetchMock.mock.calls.some((c: any) => c[0].includes('refetch-remote'))) {
            return { ok: false, status: 422 };
          }
          return { ok: true, json: async () => ({ object: { sha: 'final-sha' } }) };
        }
        // When read(key) is invoked on retry, remote still contains all comments and replies!
        if (url.includes('docs/test.a1b2c3d.comments.yml')) {
          fetchMock.mock.calls.push(['refetch-remote']);
          return {
            ok: true,
            json: async () => ({
              content: Buffer.from(yaml.dump(prevComments)).toString('base64'),
              encoding: 'base64',
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const explicitDeleted = new Set<string>(['explicit-deleted-id']);
      await backend.write(
        {
          owner: 'test-owner',
          repo: 'test-repo',
          filePath: 'docs/test.md',
          commitHash: 'a1b2c3d',
        },
        currentComments,
        prevComments,
        explicitDeleted
      );

      // The written blob content on retry must NOT have c1, r2, p1, pr2!
      const parsed = yaml.load(writtenDataText) as CommentsFile;
      expect(parsed.inline_comments.length).toBe(1);
      expect(parsed.inline_comments[0].id).toBe('c2');
      expect(parsed.inline_comments[0].replies?.length).toBe(1);
      expect(parsed.inline_comments[0].replies?.[0].id).toBe('r1');
      expect(parsed.page_comments.length).toBe(1);
      expect(parsed.page_comments[0].id).toBe('p2');
      expect(parsed.page_comments[0].replies?.length).toBe(1);
      expect(parsed.page_comments[0].replies?.[0].id).toBe('pr1');
    });

    it('properly encodes paths with spaces when fetching comments', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });

      await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'docs/ADR T9 Context Engine.md',
      });

      const firstCallUrl = fetchMock.mock.calls[0][0];
      expect(firstCallUrl).toContain('docs/ADR%20T9%20Context%20Engine.comments.yml');
    });

    it('falls back to double-encoded path when fetching comments with spaces in name', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('docs/ADR%2520T9%2520Context%2520Engine.comments.yml')) {
          return {
            ok: true,
            json: async () => ({
              content: Buffer.from('inline_comments: []\npage_comments: []\n').toString('base64'),
              encoding: 'base64',
            }),
          };
        }
        return { ok: false, status: 404 };
      });

      const res = await backend.read({
        owner: 'test-owner',
        repo: 'test-repo',
        filePath: 'docs/ADR T9 Context Engine.md',
      });
      expect(res).toEqual({ inline_comments: [], page_comments: [] });
    });

    it('dispatches a commit comment notification when new mentions exist in written comments', async () => {
      // 1. GET ref -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'parent-sha' } }),
      });
      // 2. POST tree -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sha: 'tree-sha-1' }),
      });
      // 3. POST commit -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sha: 'new-commit-sha' }),
      });
      // 4. PATCH ref -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'new-commit-sha' } }),
      });
      // 5. POST commit comment -> ok
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 456 }),
      });

      const commentsWithMention: CommentsFile = {
        inline_comments: [
          {
            id: 'c-mention',
            author: 'alice',
            anchor_text: 'sample text',
            anchor_hash: 'hash1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Hey @octocat can you review this?',
            created_at: '2026-09-01T00:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      await backend.write(
        { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md', branch: 'main' },
        commentsWithMention
      );

      // Verify 5 calls made (4 for git write + 1 for commit comment notification)
      expect(fetchMock).toHaveBeenCalledTimes(5);
      const lastCallUrl = fetchMock.mock.calls[4][0];
      expect(lastCallUrl).toBe(
        'https://api.github.com/repos/my-org/my-repo/commits/new-commit-sha/comments'
      );
      const lastCallBody = JSON.parse(fetchMock.mock.calls[4][1].body);
      expect(lastCallBody.body).toContain('💬 **@alice** mentioned you');
      expect(lastCallBody.body).toContain('Hey @octocat can you review this?');
      expect(lastCallBody.body).toContain(
        '*Sent via [Markdown Comments](https://md-comments.com)*'
      );
    });

    it('throws descriptive error when commit creation API fails after retries', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/git/ref/')) {
          return { ok: true, json: async () => ({ object: { sha: 'sha-c' } }) };
        }
        if (url.includes('/git/blobs')) {
          return { ok: true, json: async () => ({ sha: 'sha-b' }) };
        }
        if (url.includes('/git/trees')) {
          return { ok: true, json: async () => ({ sha: 'sha-t' }) };
        }
        if (url.includes('/git/commits')) {
          return { ok: false, status: 403, text: async () => 'Push access denied' };
        }
        return { ok: false, status: 404 };
      });

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).rejects.toThrow(/Failed to write comments.*Commit creation failed \(403\)/);
    });

    it('throws error when ref PATCH returns unexpected status code after retries', async () => {
      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        if (opts?.method === 'PATCH') {
          return { ok: false, status: 500 };
        }
        if (url.includes('/git/refs/md-comments/data')) {
          return { ok: true, json: async () => ({ object: { sha: 'sha-c' } }) };
        }
        if (url.includes('/git/blobs')) {
          return { ok: true, json: async () => ({ sha: 'sha-b' }) };
        }
        if (url.includes('/git/trees')) {
          return { ok: true, json: async () => ({ sha: 'sha-t' }) };
        }
        if (url.includes('/git/commits')) {
          return { ok: true, json: async () => ({ sha: 'sha-new' }) };
        }
        return { ok: false, status: 404 };
      });

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).rejects.toThrow(/Failed to write comments.*Ref update failed: 500/);
    });

    it('throws descriptive error when tree creation API fails', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('/git/ref/')) {
          return { ok: true, json: async () => ({ object: { sha: 'sha-c' } }) };
        }
        if (url.includes('/git/blobs')) {
          return { ok: true, json: async () => ({ sha: 'sha-b' }) };
        }
        if (url.includes('/git/trees')) {
          return { ok: false, status: 400, text: async () => 'Invalid tree path' };
        }
        return { ok: false, status: 404 };
      });

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).rejects.toThrow(/Tree creation failed \(400\)/);
    });

    it('retries when initial ref creation returns 422 conflict and succeeds on next attempt', async () => {
      let createRefAttempt = 0;
      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        const method = (opts?.method || 'GET').toUpperCase();
        if (url.includes('/git/blobs')) {
          return { ok: true, json: async () => ({ sha: 'sha-b' }) };
        }
        if (url.includes('/git/trees')) {
          return { ok: true, json: async () => ({ sha: 'sha-t' }) };
        }
        if (url.includes('/git/commits')) {
          return { ok: true, json: async () => ({ sha: 'sha-commit' }) };
        }
        // Ref endpoint
        if (url.includes('/git/refs/md-comments/data') && method === 'GET') {
          // On attempt 1, ref does not exist yet (404)
          if (createRefAttempt === 0) {
            return { ok: false, status: 404 };
          }
          // On attempt 2, ref was created by another worker
          return { ok: true, json: async () => ({ object: { sha: 'sha-concurrent' } }) };
        }
        if (url.includes('/git/refs') && method === 'POST') {
          createRefAttempt++;
          // First attempt to create ref collides with concurrent creator (422)
          return { ok: false, status: 422 };
        }
        if (method === 'PATCH') {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, status: 404 };
      });

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).resolves.toBeUndefined();

      expect(createRefAttempt).toBe(1);
    });

    it('throws error when initial ref creation returns unexpected status code after retries', async () => {
      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        const method = (opts?.method || 'GET').toUpperCase();
        if (url.includes('/git/refs') && method === 'POST') {
          return { ok: false, status: 500 };
        }
        if (url.includes('/git/blobs')) {
          return { ok: true, json: async () => ({ sha: 'sha-b' }) };
        }
        if (url.includes('/git/trees')) {
          return { ok: true, json: async () => ({ sha: 'sha-t' }) };
        }
        if (url.includes('/git/commits')) {
          return { ok: true, json: async () => ({ sha: 'sha-new' }) };
        }
        // Ref lookup returns 404
        return { ok: false, status: 404 };
      });

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).rejects.toThrow(/Failed to write comments.*Ref creation failed: 500/);
    });

    it('gracefully catches and logs errors when dispatchNotifications encounters an exception', async () => {
      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        const method = (opts?.method || 'GET').toUpperCase();
        if (url.includes('/git/refs/md-comments/data') && method === 'GET') {
          return { ok: true, json: async () => ({ object: { sha: 'sha-1' } }) };
        }
        if (url.includes('/git/blobs') || url.includes('/git/trees')) {
          return { ok: true, json: async () => ({ sha: 'sha-x' }) };
        }
        if (url.includes('/git/commits') && method === 'POST') {
          // If this is the commit comment notification endpoint, throw an error
          if (url.includes('/comments')) {
            throw new Error('Notification API exploded');
          }
          return { ok: true, json: async () => ({ sha: 'sha-commit-1' }) };
        }
        if (method === 'PATCH') {
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, status: 404 };
      });

      // Write comments containing a mention so notification dispatch is triggered
      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          {
            inline_comments: [
              {
                id: 'c-mention',
                author: 'alice',
                anchor_text: 'text',
                anchor_hash: 'h',
                paragraph_index: 0,
                heading_context: '',
                body: 'Hello @collaborator',
                created_at: '',
                orphaned: false,
                resolved: false,
                reactions: [],
                replies: [],
              },
            ],
            page_comments: [],
          }
        )
      ).resolves.toBeUndefined();
    });

    it('handles unexpected exceptions in dispatchNotifications without throwing', async () => {
      // Calling dispatchNotifications with invalid key arguments triggers catch block safely
      await expect(
        (backend as any).dispatchNotifications(null, null, null, 'sha-1')
      ).resolves.toBeUndefined();
    });

    it('ignores read failure when refetching remote comments during CAS retry', async () => {
      let attempt = 0;
      fetchMock.mockImplementation(async (url: string, opts?: any) => {
        const method = (opts?.method || 'GET').toUpperCase();
        if (url.includes('/git/refs/md-comments/data') && method === 'GET') {
          return { ok: true, json: async () => ({ object: { sha: 'sha-1' } }) };
        }
        if (
          url.includes('/git/blobs') ||
          url.includes('/git/trees') ||
          url.includes('/git/commits')
        ) {
          return { ok: true, json: async () => ({ sha: 'sha-x' }) };
        }
        if (method === 'PATCH') {
          attempt++;
          if (attempt === 1) {
            return { ok: false, status: 422 };
          }
          return { ok: true, json: async () => ({}) };
        }
        return { ok: false, status: 404 };
      });

      const readSpy = vi
        .spyOn(backend, 'read')
        .mockRejectedValueOnce(new Error('Simulated read failure during CAS retry'));

      await expect(
        backend.write(
          { owner: 'my-org', repo: 'my-repo', filePath: 'docs/test.md' },
          { inline_comments: [], page_comments: [] }
        )
      ).resolves.toBeUndefined();

      readSpy.mockRestore();
    });

    it('catches and logs unexpected network throws inside traceAndMigrateRename', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.includes('0000000.comments.yml')) {
          return { ok: false, status: 404 };
        }
        if (url.includes('/commits?path=')) {
          throw new Error('Network hardware failure');
        }
        return { ok: false, status: 404 };
      });

      const result = await backend.read({
        owner: 'my-org',
        repo: 'my-repo',
        filePath: 'docs/network-fail.md',
      });
      expect(result).toEqual({ inline_comments: [], page_comments: [] });
    });

    describe('traceAndMigrateRename & deleteFileFromRef', () => {
      it('migrates comments when file was renamed in Git history and deletes old path', async () => {
        const oldYml = `
inline_comments:
  - id: migrated-1
    author: alice
    anchor_text: old heading
    anchor_hash: h1
    paragraph_index: 0
    heading_context: Intro
    body: Migrated comment
    created_at: 2026-09-01T00:00:00Z
    orphaned: false
    resolved: false
    reactions: []
    replies: []
page_comments: []
`;
        const base64OldYml = Buffer.from(oldYml).toString('base64');

        fetchMock.mockImplementation(async (url: string, opts?: any) => {
          const method = (opts?.method || 'GET').toUpperCase();
          // 1. Reading new path returns 404
          if (url.includes('docs/new-file.comments.yml') && method === 'GET') {
            return { ok: false, status: 404 };
          }
          // 2. Commit log search for new file
          if (url.includes('/commits?path=docs%2Fnew-file.md')) {
            return { ok: true, json: async () => [{ sha: 'commit-rename-123' }] };
          }
          // 3. Commit detail search
          if (url.includes('/commits/commit-rename-123')) {
            return {
              ok: true,
              json: async () => ({
                files: [
                  {
                    filename: 'docs/new-file.md',
                    status: 'renamed',
                    previous_filename: 'docs/old-file.md',
                  },
                ],
              }),
            };
          }
          // 4. Old comment contents
          if (url.includes('docs/old-file.comments.yml') && method === 'GET') {
            return {
              ok: true,
              json: async () => ({
                content: base64OldYml,
                encoding: 'base64',
              }),
            };
          }
          // 5. Write methods (blobs, trees, commits, refs)
          if (url.includes('/git/blobs')) {
            return { ok: true, json: async () => ({ sha: 'sha-blob' }) };
          }
          if (url.includes('/git/trees')) {
            return { ok: true, json: async () => ({ sha: 'sha-tree' }) };
          }
          if (url.includes('/git/commits/sha-current-ref')) {
            return { ok: true, json: async () => ({ tree: { sha: 'sha-tree-base' } }) };
          }
          if (url.includes('/git/commits')) {
            return { ok: true, json: async () => ({ sha: 'sha-commit-new' }) };
          }
          if (url.includes('/git/refs/md-comments/data')) {
            if (method === 'PATCH') {
              return { ok: true, json: async () => ({}) };
            }
            return { ok: true, json: async () => ({ object: { sha: 'sha-current-ref' } }) };
          }
          return { ok: false, status: 404 };
        });

        const comments = await backend.read({
          owner: 'my-org',
          repo: 'my-repo',
          filePath: 'docs/new-file.md',
        });

        expect(comments).not.toBeNull();
        expect(comments.inline_comments).toHaveLength(1);
        expect(comments.inline_comments[0].body).toBe('Migrated comment');
      });

      it('returns empty comments file when commit history fails or has no rename events', async () => {
        // Commits endpoint returns error
        fetchMock.mockImplementation(async (url: string) => {
          if (url.includes('.comments.yml')) {
            return { ok: false, status: 404 };
          }
          if (url.includes('/commits?path=')) {
            return { ok: false, status: 500 };
          }
          return { ok: false, status: 404 };
        });

        const result1 = await backend.read({
          owner: 'my-org',
          repo: 'my-repo',
          filePath: 'docs/no-commits.md',
        });
        expect(result1).toEqual({ inline_comments: [], page_comments: [] });

        // Commits endpoint returns non-array
        fetchMock.mockImplementation(async (url: string) => {
          if (url.includes('.comments.yml')) return { ok: false, status: 404 };
          if (url.includes('/commits?path='))
            return { ok: true, json: async () => ({ error: 'bad' }) };
          return { ok: false, status: 404 };
        });

        const result2 = await backend.read({
          owner: 'my-org',
          repo: 'my-repo',
          filePath: 'docs/bad-commits.md',
        });
        expect(result2).toEqual({ inline_comments: [], page_comments: [] });

        // Commit detail returns 404 or without rename
        fetchMock.mockImplementation(async (url: string) => {
          if (url.includes('.comments.yml')) return { ok: false, status: 404 };
          if (url.includes('/commits?path='))
            return { ok: true, json: async () => [{ sha: 'c-plain' }] };
          if (url.includes('/commits/c-plain')) return { ok: false, status: 404 };
          return { ok: false, status: 404 };
        });

        const result3 = await backend.read({
          owner: 'my-org',
          repo: 'my-repo',
          filePath: 'docs/plain-commits.md',
        });
        expect(result3).toEqual({ inline_comments: [], page_comments: [] });
      });

      it('handles deleteFileFromRef errors gracefully without throwing', async () => {
        const oldYml = `
inline_comments:
  - id: c-del-err
    author: alice
    anchor_text: text
    anchor_hash: h
    paragraph_index: 0
    heading_context: ''
    body: Survives delete failure
    created_at: ''
    orphaned: false
    resolved: false
    reactions: []
    replies: []
page_comments: []
`;
        let deleteRefAttempt = false;

        fetchMock.mockImplementation(async (url: string, opts?: any) => {
          const method = (opts?.method || 'GET').toUpperCase();
          if (url.includes('docs/new-file.comments.yml') && method === 'GET') {
            return { ok: false, status: 404 };
          }
          if (url.includes('/commits?path=')) {
            return { ok: true, json: async () => [{ sha: 'c-err' }] };
          }
          if (url.includes('/commits/c-err')) {
            return {
              ok: true,
              json: async () => ({
                files: [
                  {
                    filename: 'docs/new-file.md',
                    status: 'renamed',
                    previous_filename: 'docs/old-file.md',
                  },
                ],
              }),
            };
          }
          if (url.includes('docs/old-file.comments.yml') && method === 'GET') {
            return {
              ok: true,
              json: async () => ({
                content: Buffer.from(oldYml).toString('base64'),
                encoding: 'base64',
              }),
            };
          }
          if (url.includes('/git/blobs') || url.includes('/git/trees')) {
            return { ok: true, json: async () => ({ sha: 'sha-x' }) };
          }
          if (url.includes('/git/commits/sha-current-ref')) {
            return { ok: true, json: async () => ({ tree: { sha: 'sha-tree-base' } }) };
          }
          if (url.includes('/git/commits')) {
            return { ok: true, json: async () => ({ sha: 'sha-commit-x' }) };
          }
          if (url.includes('/git/refs/md-comments/data')) {
            if (method === 'PATCH') {
              if (deleteRefAttempt) {
                throw new Error('Ref deletion network failure');
              }
              deleteRefAttempt = true;
              return { ok: true, json: async () => ({}) };
            }
            return { ok: true, json: async () => ({ object: { sha: 'sha-current-ref' } }) };
          }
          return { ok: false, status: 404 };
        });

        const result = await backend.read({
          owner: 'my-org',
          repo: 'my-repo',
          filePath: 'docs/new-file.md',
        });
        // Comments are successfully migrated even if deletion of legacy ref file threw an error
        expect(result.inline_comments).toHaveLength(1);
        expect(result.inline_comments[0].body).toBe('Survives delete failure');
      });

      it('gracefully handles non-OK responses during deleteFileFromRef steps', async () => {
        const oldYml = `
inline_comments:
  - id: c-del-step
    author: alice
    anchor_text: text
    anchor_hash: h
    paragraph_index: 0
    heading_context: ''
    body: Survives step failure
    created_at: ''
    orphaned: false
    resolved: false
    reactions: []
    replies: []
page_comments: []
`;
        for (const failingStep of ['ref', 'commit', 'tree', 'newCommit']) {
          let stepAttempt = 0;
          fetchMock.mockImplementation(async (url: string, opts?: any) => {
            const method = (opts?.method || 'GET').toUpperCase();
            if (url.includes('docs/new-file.comments.yml') && method === 'GET') {
              return { ok: false, status: 404 };
            }
            if (url.includes('/commits?path=')) {
              return { ok: true, json: async () => [{ sha: 'c-step' }] };
            }
            if (url.includes('/commits/c-step')) {
              return {
                ok: true,
                json: async () => ({
                  files: [
                    {
                      filename: 'docs/new-file.md',
                      status: 'renamed',
                      previous_filename: 'docs/old-file.md',
                    },
                  ],
                }),
              };
            }
            if (url.includes('docs/old-file.comments.yml') && method === 'GET') {
              return {
                ok: true,
                json: async () => ({
                  content: Buffer.from(oldYml).toString('base64'),
                  encoding: 'base64',
                }),
              };
            }
            if (url.includes('/git/blobs')) {
              return { ok: true, json: async () => ({ sha: 'sha-blob' }) };
            }
            if (url.includes('/git/trees')) {
              stepAttempt++;
              // If failing on tree creation during deleteFileFromRef (attempt 2 of tree creation)
              if (failingStep === 'tree' && stepAttempt >= 2) {
                return { ok: false, status: 500 };
              }
              return { ok: true, json: async () => ({ sha: 'sha-t' }) };
            }
            if (url.includes('/git/commits/sha-current-ref')) {
              if (failingStep === 'commit') {
                return { ok: false, status: 404, text: async () => '' };
              }
              return { ok: true, json: async () => ({ tree: { sha: 'sha-tree-base' } }) };
            }
            if (url.includes('/git/commits')) {
              const bodyStr = typeof opts?.body === 'string' ? opts.body : '';
              if (failingStep === 'newCommit' && bodyStr.includes('Migrate comments: delete')) {
                return { ok: false, status: 500, text: async () => '' };
              }
              return { ok: true, json: async () => ({ sha: 'sha-commit' }) };
            }
            if (url.includes('/git/refs/md-comments/data')) {
              if (method === 'PATCH') {
                return { ok: true, json: async () => ({}) };
              }
              const bodyStr = typeof opts?.body === 'string' ? opts.body : '';
              if (failingStep === 'ref' && stepAttempt >= 1 && !bodyStr) {
                return { ok: false, status: 404, text: async () => '' };
              }
              return { ok: true, json: async () => ({ object: { sha: 'sha-current-ref' } }) };
            }
            return { ok: false, status: 404, text: async () => '' };
          });

          const result = await backend.read({
            owner: 'my-org',
            repo: 'my-repo',
            filePath: 'docs/new-file.md',
          });
          expect(result.inline_comments).toHaveLength(1);
        }
      });
    });
  });
});
