import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import type { CommentsFile } from '../shared/types';
import { GitHubOrphanRefBackend } from '../shared/gitRefBackend';

// Setup DOM and Chrome mocks before importing content.ts
type MockEventListener = (...args: any[]) => void;
const mockStorage: Record<string, any> = {};
const mockEventListeners: Record<string, MockEventListener[]> = {};

(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn((defaults: any, callback: (items: any) => void) => {
        const result: Record<string, any> = {};
        for (const key of Object.keys(defaults)) {
          result[key] = mockStorage[key] !== undefined ? mockStorage[key] : defaults[key];
        }
        if (callback) callback(result);
      }),
      set: vi.fn((items: any, callback?: () => void) => {
        Object.assign(mockStorage, items);
        if (callback) callback();
      }),
      remove: vi.fn((keys: string[], callback?: () => void) => {
        for (const k of keys) {
          delete mockStorage[k];
        }
        if (callback) callback();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

if (typeof document === 'undefined') {
  (globalThis as any).document = {
    addEventListener: vi.fn((event: string, handler: MockEventListener) => {
      mockEventListeners[event] = mockEventListeners[event] || [];
      mockEventListeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getElementById: vi.fn(() => null),
    createElement: vi.fn(() => ({
      style: {},
      classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
    })),
    head: { appendChild: vi.fn() },
    body: {
      classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) },
      appendChild: vi.fn(),
    },
  };
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: {
      href: 'https://github.com/test-owner/test-repo/blob/main/test.md',
      pathname: '/test-owner/test-repo/blob/main/test.md',
    },
    addEventListener: vi.fn((event: string, handler: MockEventListener) => {
      mockEventListeners[event] = mockEventListeners[event] || [];
      mockEventListeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
  };
}

let tombstonedCommentIds: Set<string>;
let addTombstones: (idOrIds: string | string[] | Set<string>) => void;
let filterTombstones: (comments: CommentsFile) => CommentsFile;
let mergeLocalComments: (local: CommentsFile, fetched: CommentsFile) => CommentsFile;

describe('Chrome Extension Deletion Resilience & Anti-Resurrection', () => {
  beforeAll(async () => {
    const content = await import('../chrome-extension/src/content');
    tombstonedCommentIds = content.tombstonedCommentIds;
    addTombstones = content.addTombstones;
    filterTombstones = content.filterTombstones;
    mergeLocalComments = content.mergeLocalComments;
  });

  beforeEach(() => {
    tombstonedCommentIds?.clear();
  });

  describe('Tombstone Registration & Filtering', () => {
    it('registers single and multiple tombstoned IDs with trimming', () => {
      addTombstones(' c-1 ');
      addTombstones([' c-2 ', 'c-3']);
      addTombstones(new Set([' c-4 ']));

      expect(tombstonedCommentIds.has('c-1')).toBe(true);
      expect(tombstonedCommentIds.has('c-2')).toBe(true);
      expect(tombstonedCommentIds.has('c-3')).toBe(true);
      expect(tombstonedCommentIds.has('c-4')).toBe(true);
    });

    it('filters out tombstoned inline and page comments from CommentsFile', () => {
      addTombstones(['inline-del', 'page-del']);

      const raw: CommentsFile = {
        inline_comments: [
          {
            id: 'inline-del',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: '123',
            paragraph_index: 0,
            heading_context: '',
            body: 'to be deleted',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'inline-keep',
            author: 'bob',
            anchor_text: 'world',
            anchor_hash: '456',
            paragraph_index: 1,
            heading_context: '',
            body: 'must stay',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [
          {
            id: 'page-del',
            author: 'alice',
            body: 'page comment to delete',
            created_at: new Date().toISOString(),
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'page-keep',
            author: 'charlie',
            body: 'page comment to keep',
            created_at: new Date().toISOString(),
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      const filtered = filterTombstones(raw);
      expect(filtered.inline_comments.map((c) => c.id)).toEqual(['inline-keep']);
      expect(filtered.page_comments.map((c) => c.id)).toEqual(['page-keep']);
    });

    it('filters out tombstoned replies while retaining parent comments', () => {
      addTombstones('reply-del');

      const raw: CommentsFile = {
        inline_comments: [
          {
            id: 'root-1',
            author: 'alice',
            anchor_text: 'hello',
            anchor_hash: '123',
            paragraph_index: 0,
            heading_context: '',
            body: 'root comment',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'reply-del',
                author: 'bob',
                body: 'delete this reply',
                created_at: new Date().toISOString(),
                reactions: [],
              },
              {
                id: 'reply-keep',
                author: 'charlie',
                body: 'keep this reply',
                created_at: new Date().toISOString(),
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [],
      };

      const filtered = filterTombstones(raw);
      expect(filtered.inline_comments[0].replies.map((r) => r.id)).toEqual(['reply-keep']);
    });
  });

  describe('mergeLocalComments Anti-Resurrection Protection', () => {
    it('prevents stale remote responses from resurrecting deleted inline and page comments', () => {
      const initialComments: CommentsFile = {
        inline_comments: [
          {
            id: 'inline-deleted',
            author: 'alice',
            anchor_text: 'anchor',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'deleted inline comment',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'inline-survivor',
            author: 'bob',
            anchor_text: 'anchor 2',
            anchor_hash: 'h2',
            paragraph_index: 1,
            heading_context: '',
            body: 'surviving inline comment',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [
          {
            id: 'page-deleted',
            author: 'alice',
            body: 'deleted page comment',
            created_at: new Date().toISOString(),
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'page-survivor',
            author: 'charlie',
            body: 'surviving page comment',
            created_at: new Date().toISOString(),
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      // 1. User performs deletion locally: tombstones registered and local state filtered
      addTombstones(['inline-deleted', 'page-deleted']);
      const localState: CommentsFile = {
        inline_comments: [initialComments.inline_comments[1]],
        page_comments: [initialComments.page_comments[1]],
      };

      // 2. Stale remote backend response arrives (e.g. from background sync or focus during/after write)
      // Remote still contains initialComments (including the deleted ones)
      const staleFetched: CommentsFile = JSON.parse(JSON.stringify(initialComments));

      // 3. mergeLocalComments must drop the tombstoned comments and keep only survivors
      const merged = mergeLocalComments(localState, staleFetched);

      expect(merged.inline_comments.some((c) => c.id === 'inline-deleted')).toBe(false);
      expect(merged.inline_comments.some((c) => c.id === 'inline-survivor')).toBe(true);

      expect(merged.page_comments.some((c) => c.id === 'page-deleted')).toBe(false);
      expect(merged.page_comments.some((c) => c.id === 'page-survivor')).toBe(true);
    });

    it('prevents stale remote responses from resurrecting deleted replies', () => {
      addTombstones('reply-deleted');

      const localState: CommentsFile = {
        inline_comments: [
          {
            id: 'root-c1',
            author: 'alice',
            anchor_text: 'anchor',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'parent comment',
            created_at: new Date().toISOString(),
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'reply-survivor',
                author: 'bob',
                body: 'surviving reply',
                created_at: new Date().toISOString(),
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [],
      };

      const staleFetched: CommentsFile = {
        inline_comments: [
          {
            ...localState.inline_comments[0],
            replies: [
              {
                id: 'reply-deleted',
                author: 'eve',
                body: 'stale reply that was deleted',
                created_at: new Date().toISOString(),
                reactions: [],
              },
              {
                id: 'reply-survivor',
                author: 'bob',
                body: 'surviving reply',
                created_at: new Date().toISOString(),
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [],
      };

      const merged = mergeLocalComments(localState, staleFetched);
      expect(merged.inline_comments[0].replies.some((r) => r.id === 'reply-deleted')).toBe(false);
      expect(merged.inline_comments[0].replies.some((r) => r.id === 'reply-survivor')).toBe(true);
    });
  });

  describe('Background Sync & Write Barrier', () => {
    it('synchronizes lastKnownRefSha using getLatestRefSha', async () => {
      const backend = new GitHubOrphanRefBackend(() => 'test-token');
      const fetchApiSpy = vi.spyOn(backend as any, 'fetchApi');

      fetchApiSpy.mockImplementation((async (...args: any[]) => {
        const url = String(args[0] || '');
        const opts = args[1];
        const method = (opts?.method || 'GET').toUpperCase();
        if (url.includes('/git/refs/md-comments/data') && method === 'GET') {
          return {
            ok: true,
            json: async () => ({ object: { sha: 'synced-commit-sha-999' } }),
          };
        }
        return { ok: false, status: 404 };
      }) as any);

      const sha = await backend.getLatestRefSha('owner', 'repo');
      expect(sha).toBe('synced-commit-sha-999');
    });

    it('manages lastKnownRefSha state and tracks active writes correctly', async () => {
      const content = await import('../chrome-extension/src/content');
      content.setLastKnownRefSha('initial-sha-123');
      expect(content.getLastKnownRefSha()).toBe('initial-sha-123');

      content.setLastKnownRefSha('updated-sha-456');
      expect(content.getLastKnownRefSha()).toBe('updated-sha-456');

      expect(content.getActiveWritesCount()).toBe(0);
    });
  });
});
