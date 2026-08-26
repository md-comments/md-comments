import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as yaml from 'js-yaml';
import {
  GitHubOrphanRefBackend,
  commentsFilePathForMarkdown,
  mergeCommentsFiles,
  ORPHAN_REF_NAME,
} from '../shared/gitRefBackend';
import type { CommentsFile } from '../shared/types';

describe('GitHubOrphanRefBackend', () => {
  describe('commentsFilePathForMarkdown', () => {
    it('converts .md extensions to .comments.yml', () => {
      expect(commentsFilePathForMarkdown('README.md')).toBe('README.comments.yml');
      expect(commentsFilePathForMarkdown('docs/intro.md')).toBe('docs/intro.comments.yml');
    });

    it('leaves existing .comments.yml paths unchanged', () => {
      expect(commentsFilePathForMarkdown('docs/intro.comments.yml')).toBe(
        'docs/intro.comments.yml'
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
      // GET content -> 404
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
  });
});
