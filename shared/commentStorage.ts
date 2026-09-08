import type { CommentsFile } from './types.js';

export interface CommentStorageKey {
  owner: string;
  repo: string;
  filePath: string;
  branch?: string;
  commitHash?: string;
}

export interface CommentBackend {
  read(key: CommentStorageKey): Promise<CommentsFile>;
  write(
    key: CommentStorageKey,
    data: CommentsFile,
    previousData?: CommentsFile | null,
    deletedIds?: Set<string>
  ): Promise<void>;
  addComment?(
    key: CommentStorageKey,
    type: 'inline' | 'page',
    fields: Record<string, unknown>
  ): Promise<void>;
}
