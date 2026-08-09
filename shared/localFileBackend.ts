import type { CommentBackend, CommentStorageKey } from './commentStorage';
import type { CommentsFile } from './types';

export interface LocalFileAdapter {
  readText(commentsPath: string): Promise<string | null>;
  writeText(commentsPath: string, text: string): Promise<void>;
  pathForMarkdown(filePath: string): string;
  parseYaml(text: string): Partial<CommentsFile>;
  dumpYaml(data: CommentsFile): string;
}

export class LocalFileBackend implements CommentBackend {
  constructor(private adapter: LocalFileAdapter) {}

  async read(key: CommentStorageKey): Promise<CommentsFile> {
    const commentsPath = this.adapter.pathForMarkdown(key.filePath);
    try {
      const text = await this.adapter.readText(commentsPath);
      if (!text) {
        return { page_comments: [], inline_comments: [] };
      }
      const parsed = this.adapter.parseYaml(text);
      return {
        page_comments: parsed.page_comments || [],
        inline_comments: parsed.inline_comments || [],
      };
    } catch {
      return { page_comments: [], inline_comments: [] };
    }
  }

  async write(key: CommentStorageKey, data: CommentsFile): Promise<void> {
    const commentsPath = this.adapter.pathForMarkdown(key.filePath);
    const text = this.adapter.dumpYaml(data);
    await this.adapter.writeText(commentsPath, text);
  }
}
