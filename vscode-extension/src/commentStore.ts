import * as vscode from 'vscode';
import { getAuthor } from './author';
import { authorsMatch } from './githubDisplayNames';
import { getOAuthToken } from './githubAuth';
import { resolveStorageKeyForUri } from './repoManager';
import { globalOptimisticStore } from './optimisticStore';
import { logDebug } from './logger';
import type {
  CommentsFile,
  CommentRootType,
  InlineComment,
  PageComment,
  Reaction,
  Reply,
} from '../../shared/types';

import { GitHubOrphanRefBackend, commentsFilePathForMarkdown } from '../../shared/gitRefBackend';

const gitRefBackend = new GitHubOrphanRefBackend(() => getOAuthToken());

const EMPTY: CommentsFile = { page_comments: [], inline_comments: [] };

export function commentsUriForMarkdown(mdUri: vscode.Uri, commitHash?: string): vscode.Uri {
  if (mdUri.scheme === 'file') {
    const commentsPath = commentsFilePathForMarkdown(mdUri.fsPath, commitHash);
    return vscode.Uri.file(commentsPath);
  }
  const commentsPath = commentsFilePathForMarkdown(mdUri.path, commitHash);
  return mdUri.with({ path: commentsPath });
}

export function commentsFsPathForMarkdown(mdUri: vscode.Uri, commitHash?: string): string {
  const uri = commentsUriForMarkdown(mdUri, commitHash);
  if (uri.scheme === 'file') {
    return uri.fsPath;
  }
  return uri.path;
}

export async function readComments(mdUri: vscode.Uri, forceRefresh = false): Promise<CommentsFile> {
  logDebug(`readComments called for: ${mdUri.toString()}, forceRefresh=${forceRefresh}`);
  const key = await resolveStorageKeyForUri(mdUri);
  logDebug(`readComments resolved storage key:`, key);
  if (!key) {
    logDebug('readComments key is null, returning empty comments');
    return { ...EMPTY };
  }

  const fileData = await globalOptimisticStore.getComments(
    key,
    () => {
      logDebug(`readComments fetching remote data from gitRefBackend for key:`, key);
      return gitRefBackend.read(key);
    },
    forceRefresh
  );
  logDebug(
    `readComments data loaded successfully, inline count: ${fileData.inline_comments.length}`
  );
  return normalizeCommentsFile(fileData);
}

export async function writeComments(mdUri: vscode.Uri, data: CommentsFile): Promise<string> {
  logDebug(`writeComments called for: ${mdUri.toString()}`);
  const key = await resolveStorageKeyForUri(mdUri);
  logDebug(`writeComments resolved storage key:`, key);
  if (!key) {
    throw new Error('Markdown Comments: Document is not in a valid GitHub repository workspace.');
  }

  const normalized = normalizeCommentsFile(data);
  globalOptimisticStore.updateComments(key, normalized, () => {
    logDebug(`writeComments triggering remote write for key:`, key);
    return gitRefBackend.write(key, normalized);
  });
  return `${key.owner}/${key.repo}/${key.filePath}`;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeReply(raw: Reply): Reply {
  return {
    id: raw.id,
    author: raw.author,
    body: raw.body,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    reactions: raw.reactions ?? [],
  };
}

function normalizePageComment(raw: PageComment): PageComment {
  return {
    id: raw.id,
    author: raw.author,
    body: raw.body,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    resolved: !!raw.resolved,
    resolved_at: raw.resolved_at,
    reactions: raw.reactions ?? [],
    replies: (raw.replies ?? []).map(normalizeReply),
  };
}

function normalizeInlineComment(raw: InlineComment): InlineComment {
  return {
    id: raw.id,
    author: raw.author,
    anchor_text: raw.anchor_text,
    anchor_hash: raw.anchor_hash,
    paragraph_index: raw.paragraph_index,
    heading_context: raw.heading_context,
    body: raw.body,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    orphaned: !!raw.orphaned,
    orphaned_at: raw.orphaned_at,
    resolved: !!raw.resolved,
    resolved_at: raw.resolved_at,
    reactions: raw.reactions ?? [],
    replies: (raw.replies ?? []).map(normalizeReply),
  };
}

function normalizeCommentsFile(parsed: Partial<CommentsFile>): CommentsFile {
  return {
    page_comments: Array.isArray(parsed.page_comments)
      ? parsed.page_comments.map(normalizePageComment)
      : [],
    inline_comments: Array.isArray(parsed.inline_comments)
      ? parsed.inline_comments.map(normalizeInlineComment)
      : [],
  };
}

export async function addInlineComment(
  mdUri: vscode.Uri,
  fields: {
    body: string;
    anchor_text: string;
    anchor_hash: string;
    paragraph_index: number;
    heading_context: string;
  }
): Promise<{ comment: InlineComment; savedPath: string }> {
  const data = await readComments(mdUri);
  const comment: InlineComment = {
    id: newId('c'),
    author: await getAuthor(),
    anchor_text: fields.anchor_text,
    anchor_hash: fields.anchor_hash,
    paragraph_index: fields.paragraph_index,
    heading_context: fields.heading_context,
    body: fields.body,
    created_at: new Date().toISOString(),
    orphaned: false,
    resolved: false,
    reactions: [],
    replies: [],
  };
  data.inline_comments.push(comment);
  const savedPath = await writeComments(mdUri, data);
  return { comment, savedPath };
}

export async function addPageComment(
  mdUri: vscode.Uri,
  body: string
): Promise<{ comment: PageComment; savedPath: string }> {
  const data = await readComments(mdUri);
  const comment: PageComment = {
    id: newId('c'),
    author: await getAuthor(),
    body,
    created_at: new Date().toISOString(),
    resolved: false,
    reactions: [],
    replies: [],
  };
  data.page_comments.push(comment);
  const savedPath = await writeComments(mdUri, data);
  return { comment, savedPath };
}

export async function addReply(
  mdUri: vscode.Uri,
  rootId: string,
  type: CommentRootType,
  body: string
): Promise<string> {
  const data = await readComments(mdUri);
  const root =
    type === 'page'
      ? data.page_comments.find((c) => c.id === rootId)
      : data.inline_comments.find((c) => c.id === rootId);
  if (!root) {
    throw new Error(`Comment ${rootId} not found`);
  }
  root.replies.push({
    id: newId(`${rootId}-r`),
    author: await getAuthor(),
    body,
    created_at: new Date().toISOString(),
    reactions: [],
  });
  return writeComments(mdUri, data);
}

export async function deleteComment(
  mdUri: vscode.Uri,
  id: string,
  type: CommentRootType,
  kind: 'root' | 'reply',
  rootId?: string
): Promise<string> {
  const data = await readComments(mdUri);
  if (kind === 'reply') {
    const roots = type === 'page' ? data.page_comments : data.inline_comments;
    const root = roots.find((c) => c.id === rootId);
    if (!root) {
      throw new Error(`Comment ${rootId ?? ''} not found`);
    }
    const idx = root.replies.findIndex((r) => r.id === id);
    if (idx < 0) {
      throw new Error(`Reply ${id} not found`);
    }
    root.replies.splice(idx, 1);
    return writeComments(mdUri, data);
  }

  if (type === 'page') {
    const idx = data.page_comments.findIndex((c) => c.id === id);
    if (idx < 0) {
      throw new Error(`Comment ${id} not found`);
    }
    data.page_comments.splice(idx, 1);
  } else {
    const idx = data.inline_comments.findIndex((c) => c.id === id);
    if (idx < 0) {
      throw new Error(`Comment ${id} not found`);
    }
    data.inline_comments.splice(idx, 1);
  }
  return writeComments(mdUri, data);
}

export async function editComment(
  mdUri: vscode.Uri,
  id: string,
  type: CommentRootType,
  kind: 'root' | 'reply',
  rootId: string | undefined,
  body: string
): Promise<string> {
  const user = await getAuthor();
  const data = await readComments(mdUri);
  if (!body.trim()) {
    throw new Error('Comment must include text');
  }

  if (kind === 'reply') {
    const roots = type === 'page' ? data.page_comments : data.inline_comments;
    const root = roots.find((c) => c.id === rootId);
    if (!root) {
      throw new Error(`Comment ${rootId ?? ''} not found`);
    }
    const reply = root.replies.find((r) => r.id === id);
    if (!reply) {
      throw new Error(`Reply ${id} not found`);
    }
    if (!authorsMatch(reply.author, user)) {
      throw new Error('You can only edit your own comments');
    }
    reply.body = body;
    reply.updated_at = new Date().toISOString();
    return writeComments(mdUri, data);
  }

  const root =
    type === 'page'
      ? data.page_comments.find((c) => c.id === id)
      : data.inline_comments.find((c) => c.id === id);
  if (!root) {
    throw new Error(`Comment ${id} not found`);
  }
  if (!authorsMatch(root.author, user)) {
    throw new Error('You can only edit your own comments');
  }
  root.body = body;
  root.updated_at = new Date().toISOString();
  return writeComments(mdUri, data);
}

export async function resolveComment(
  mdUri: vscode.Uri,
  id: string,
  type: CommentRootType
): Promise<string> {
  const data = await readComments(mdUri);
  const root =
    type === 'page'
      ? data.page_comments.find((c) => c.id === id)
      : data.inline_comments.find((c) => c.id === id);
  if (!root) {
    throw new Error(`Comment ${id} not found`);
  }
  root.resolved = true;
  root.resolved_at = new Date().toISOString();
  return writeComments(mdUri, data);
}

export async function unresolveComment(
  mdUri: vscode.Uri,
  id: string,
  type: CommentRootType
): Promise<string> {
  const data = await readComments(mdUri);
  const root =
    type === 'page'
      ? data.page_comments.find((c) => c.id === id)
      : data.inline_comments.find((c) => c.id === id);
  if (!root) {
    throw new Error(`Comment ${id} not found`);
  }
  root.resolved = false;
  delete root.resolved_at;
  return writeComments(mdUri, data);
}

function applyReactionToggle(reactions: Reaction[], emoji: string, user: string): Reaction[] {
  const copy = reactions.map((r) => ({ ...r, users: [...r.users] }));
  const existing = copy.find((r) => r.emoji === emoji);
  if (existing) {
    const idx = existing.users.indexOf(user);
    if (idx >= 0) {
      existing.users.splice(idx, 1);
    } else {
      existing.users.push(user);
    }
    return copy.filter((r) => r.users.length > 0);
  }
  copy.push({ emoji, users: [user] });
  return copy;
}

export async function toggleReaction(
  mdUri: vscode.Uri,
  targetId: string,
  kind: 'root' | 'reply',
  rootId: string,
  type: CommentRootType,
  emoji: string
): Promise<string> {
  const data = await readComments(mdUri);
  const user = await getAuthor();
  const roots = type === 'page' ? data.page_comments : data.inline_comments;
  const root = roots.find((c) => c.id === rootId);
  if (!root) {
    throw new Error(`Comment ${rootId} not found`);
  }
  if (kind === 'root') {
    root.reactions = applyReactionToggle(root.reactions, emoji, user);
  } else {
    const reply = root.replies.find((r) => r.id === targetId);
    if (!reply) {
      throw new Error(`Reply ${targetId} not found`);
    }
    reply.reactions = applyReactionToggle(reply.reactions, emoji, user);
  }
  return writeComments(mdUri, data);
}

export async function reanchorComment(
  mdUri: vscode.Uri,
  id: string,
  fields: {
    anchor_text: string;
    anchor_hash: string;
    paragraph_index: number;
    heading_context: string;
  }
): Promise<string> {
  const data = await readComments(mdUri);
  const comment = data.inline_comments.find((c) => c.id === id);
  if (!comment) {
    throw new Error(`Comment ${id} not found`);
  }
  comment.anchor_text = fields.anchor_text;
  comment.anchor_hash = fields.anchor_hash;
  comment.paragraph_index = fields.paragraph_index;
  comment.heading_context = fields.heading_context;
  comment.orphaned = false;
  delete comment.orphaned_at;
  return writeComments(mdUri, data);
}

export async function updateOrphanFlags(
  mdUri: vscode.Uri,
  orphanIds: Set<string>
): Promise<boolean> {
  const data = await readComments(mdUri);
  let changed = false;
  const now = new Date().toISOString();
  for (const c of data.inline_comments) {
    if (c.resolved) {
      continue;
    }
    const shouldOrphan = orphanIds.has(c.id);
    if (shouldOrphan && !c.orphaned) {
      c.orphaned = true;
      c.orphaned_at = now;
      changed = true;
    } else if (!shouldOrphan && c.orphaned) {
      c.orphaned = false;
      delete c.orphaned_at;
      changed = true;
    }
  }
  if (changed) {
    await writeComments(mdUri, data);
  }
  return changed;
}
