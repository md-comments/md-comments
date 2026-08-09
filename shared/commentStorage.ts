import type { CommentsFile } from './types';

export interface CommentStorageKey {
  owner: string;
  repo: string;
  filePath: string;
  branch?: string;
}

export interface CommentBackend {
  read(key: CommentStorageKey): Promise<CommentsFile>;
  write(key: CommentStorageKey, data: CommentsFile): Promise<void>;
  addComment?(
    key: CommentStorageKey,
    type: 'inline' | 'page',
    fields: Record<string, unknown>
  ): Promise<void>;
}
