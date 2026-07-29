import { App, TFile } from 'obsidian';
import * as yaml from 'js-yaml';
import type {
  CommentsFile,
  CommentRootType,
  InlineComment,
  PageComment,
  Reaction,
  Reply,
} from '../../shared/types';

const EMPTY: CommentsFile = { page_comments: [], inline_comments: [] };

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

export class CommentStore {
  constructor(
    private app: App,
    private getAuthorName: () => string
  ) {}

  getCommentsPath(mdFile: TFile): string {
    return mdFile.path.replace(/\.md$/i, '.comments.yml');
  }

  async readComments(mdFile: TFile): Promise<CommentsFile> {
    const commentsPath = this.getCommentsPath(mdFile);
    const abstractFile = this.app.vault.getAbstractFileByPath(commentsPath);
    if (!abstractFile || !(abstractFile instanceof TFile)) {
      return { ...EMPTY };
    }
    try {
      const data = await this.app.vault.read(abstractFile);
      const parsed = yaml.load(data) as Partial<CommentsFile>;
      return normalizeCommentsFile(parsed ?? {});
    } catch (err) {
      console.error('[md-comments] failed to read comments file', err);
      return { ...EMPTY };
    }
  }

  async writeComments(mdFile: TFile, data: CommentsFile): Promise<void> {
    const commentsPath = this.getCommentsPath(mdFile);
    const text = yaml.dump(data, { lineWidth: -1, noRefs: true });
    const abstractFile = this.app.vault.getAbstractFileByPath(commentsPath);

    if (abstractFile && abstractFile instanceof TFile) {
      await this.app.vault.modify(abstractFile, text);
    } else {
      await this.app.vault.create(commentsPath, text);
    }
  }

  async addInlineComment(
    mdFile: TFile,
    fields: {
      body: string;
      anchor_text: string;
      anchor_hash: string;
      paragraph_index: number;
      heading_context: string;
    }
  ): Promise<InlineComment> {
    const data = await this.readComments(mdFile);
    const comment: InlineComment = {
      id: newId('c'),
      author: this.getAuthorName(),
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
    await this.writeComments(mdFile, data);
    return comment;
  }

  async addPageComment(mdFile: TFile, body: string): Promise<PageComment> {
    const data = await this.readComments(mdFile);
    const comment: PageComment = {
      id: newId('c'),
      author: this.getAuthorName(),
      body,
      created_at: new Date().toISOString(),
      resolved: false,
      reactions: [],
      replies: [],
    };
    data.page_comments.push(comment);
    await this.writeComments(mdFile, data);
    return comment;
  }

  async addReply(
    mdFile: TFile,
    rootId: string,
    type: CommentRootType,
    body: string
  ): Promise<void> {
    const data = await this.readComments(mdFile);
    const root =
      type === 'page'
        ? data.page_comments.find((c) => c.id === rootId)
        : data.inline_comments.find((c) => c.id === rootId);
    if (!root) {
      throw new Error(`Comment ${rootId} not found`);
    }
    root.replies.push({
      id: newId(`${rootId}-r`),
      author: this.getAuthorName(),
      body,
      created_at: new Date().toISOString(),
      reactions: [],
    });
    await this.writeComments(mdFile, data);
  }

  async deleteComment(
    mdFile: TFile,
    id: string,
    type: CommentRootType,
    kind: 'root' | 'reply',
    rootId?: string
  ): Promise<void> {
    const data = await this.readComments(mdFile);
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
      await this.writeComments(mdFile, data);
      return;
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
    await this.writeComments(mdFile, data);
  }

  async editComment(
    mdFile: TFile,
    id: string,
    type: CommentRootType,
    kind: 'root' | 'reply',
    rootId: string | undefined,
    body: string
  ): Promise<void> {
    const user = this.getAuthorName();
    const data = await this.readComments(mdFile);
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
      if (reply.author !== user) {
        throw new Error('You can only edit your own comments');
      }
      reply.body = body;
      reply.updated_at = new Date().toISOString();
      await this.writeComments(mdFile, data);
      return;
    }

    const root =
      type === 'page'
        ? data.page_comments.find((c) => c.id === id)
        : data.inline_comments.find((c) => c.id === id);
    if (!root) {
      throw new Error(`Comment ${id} not found`);
    }
    if (root.author !== user) {
      throw new Error('You can only edit your own comments');
    }
    root.body = body;
    root.updated_at = new Date().toISOString();
    await this.writeComments(mdFile, data);
  }

  async resolveComment(mdFile: TFile, id: string, type: CommentRootType): Promise<void> {
    const data = await this.readComments(mdFile);
    const root =
      type === 'page'
        ? data.page_comments.find((c) => c.id === id)
        : data.inline_comments.find((c) => c.id === id);
    if (!root) {
      throw new Error(`Comment ${id} not found`);
    }
    root.resolved = true;
    root.resolved_at = new Date().toISOString();
    await this.writeComments(mdFile, data);
  }

  async unresolveComment(mdFile: TFile, id: string, type: CommentRootType): Promise<void> {
    const data = await this.readComments(mdFile);
    const root =
      type === 'page'
        ? data.page_comments.find((c) => c.id === id)
        : data.inline_comments.find((c) => c.id === id);
    if (!root) {
      throw new Error(`Comment ${id} not found`);
    }
    root.resolved = false;
    delete root.resolved_at;
    await this.writeComments(mdFile, data);
  }

  async toggleReaction(
    mdFile: TFile,
    targetId: string,
    kind: 'root' | 'reply',
    rootId: string,
    type: CommentRootType,
    emoji: string
  ): Promise<void> {
    const data = await this.readComments(mdFile);
    const user = this.getAuthorName();
    const roots = type === 'page' ? data.page_comments : data.inline_comments;
    const root = roots.find((c) => c.id === rootId);
    if (!root) {
      throw new Error(`Comment ${rootId} not found`);
    }

    const applyReactionToggle = (
      reactions: Reaction[],
      emojiStr: string,
      userStr: string
    ): Reaction[] => {
      const copy = reactions.map((r) => ({ ...r, users: [...r.users] }));
      const existing = copy.find((r) => r.emoji === emojiStr);
      if (existing) {
        const idx = existing.users.indexOf(userStr);
        if (idx >= 0) {
          existing.users.splice(idx, 1);
        } else {
          existing.users.push(userStr);
        }
        return copy.filter((r) => r.users.length > 0);
      }
      copy.push({ emoji: emojiStr, users: [userStr] });
      return copy;
    };

    if (kind === 'root') {
      root.reactions = applyReactionToggle(root.reactions, emoji, user);
    } else {
      const reply = root.replies.find((r) => r.id === targetId);
      if (!reply) {
        throw new Error(`Reply ${targetId} not found`);
      }
      reply.reactions = applyReactionToggle(reply.reactions, emoji, user);
    }
    await this.writeComments(mdFile, data);
  }

  async reanchorComment(
    mdFile: TFile,
    id: string,
    fields: {
      anchor_text: string;
      anchor_hash: string;
      paragraph_index: number;
      heading_context: string;
    }
  ): Promise<void> {
    const data = await this.readComments(mdFile);
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
    await this.writeComments(mdFile, data);
  }

  async updateOrphanFlags(mdFile: TFile, orphanIds: Set<string>): Promise<boolean> {
    const data = await this.readComments(mdFile);
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
      await this.writeComments(mdFile, data);
    }
    return changed;
  }
}
