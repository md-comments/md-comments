import type { CommentBackend, CommentStorageKey } from './commentStorage.js';
import type { CommentsFile } from './types.js';
import { mergeCommentsFiles } from './gitRefBackend.js';

export interface LocalFileAdapter {
  readText(commentsPath: string): Promise<string | null>;
  writeText(commentsPath: string, text: string): Promise<void>;
  pathForMarkdown(filePath: string, commitHash?: string): string;
  parseYaml(text: string): Partial<CommentsFile>;
  dumpYaml(data: CommentsFile): string;
}

export class LocalFileBackend implements CommentBackend {
  constructor(private adapter: LocalFileAdapter) {}

  async read(key: CommentStorageKey): Promise<CommentsFile> {
    const commentsPath = this.adapter.pathForMarkdown(key.filePath, key.commitHash);
    const legacyPath = this.adapter.pathForMarkdown(key.filePath);

    let result: CommentsFile = { page_comments: [], inline_comments: [] };

    try {
      const text = await this.adapter.readText(commentsPath);
      if (text) {
        const parsed = this.adapter.parseYaml(text);
        result = mergeCommentsFiles(result, {
          page_comments: parsed.page_comments || [],
          inline_comments: parsed.inline_comments || [],
        });
      }
    } catch {
      /* ignore */
    }

    if (legacyPath !== commentsPath) {
      try {
        const legacyText = await this.adapter.readText(legacyPath);
        if (legacyText) {
          const parsed = this.adapter.parseYaml(legacyText);
          result = mergeCommentsFiles(result, {
            page_comments: parsed.page_comments || [],
            inline_comments: parsed.inline_comments || [],
          });
        }
      } catch {
        /* ignore */
      }
    }

    return result;
  }

  async write(key: CommentStorageKey, data: CommentsFile): Promise<void> {
    const commentsPath = this.adapter.pathForMarkdown(key.filePath, key.commitHash);
    const text = this.adapter.dumpYaml(data);
    await this.adapter.writeText(commentsPath, text);
  }
}
