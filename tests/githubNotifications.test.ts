import { describe, it, expect, vi } from 'vitest';
import {
  formatNotificationBody,
  findNewlyMentionedEvents,
  dispatchCommitCommentNotification,
  NotificationEvent,
} from '../shared/githubNotifications';
import type { CommentsFile } from '../shared/types';

describe('shared/githubNotifications', () => {
  describe('formatNotificationBody', () => {
    it('formats a notification with file, line, anchor quote, and author', () => {
      const body = formatNotificationBody({
        author: 'alice',
        filePath: 'docs/guide.md',
        line: 42,
        documentUrl: 'https://github.com/owner/repo/blob/main/docs/guide.md#L42',
        anchorSnippet: 'Architecture overview statement',
        commentBody: 'Hey @bob what do you think?',
      });

      expect(body).toContain(
        '💬 **@alice** mentioned you on [`docs/guide.md#L42`](https://github.com/owner/repo/blob/main/docs/guide.md#L42):'
      );
      expect(body).toContain('> *"Architecture overview statement"*');
      expect(body).toContain('Hey @bob what do you think?');
      expect(body).toContain('*Sent via [Markdown Comments](https://md-comments.com)*');
      expect(body).not.toContain('.comments.yml');
    });

    it('formats a notification without anchor snippet when omitted', () => {
      const body = formatNotificationBody({
        author: 'charlie',
        filePath: 'README.md',
        commentBody: 'Page level comment @david check this',
      });

      expect(body).toContain('💬 **@charlie** mentioned you on [`README.md`](#):');
      expect(body).not.toContain('> *');
      expect(body).toContain('Page level comment @david check this');
      expect(body).toContain('*Sent via [Markdown Comments](https://md-comments.com)*');
    });
  });

  describe('findNewlyMentionedEvents', () => {
    const meta = { owner: 'owner', repo: 'repo', filePath: 'docs/api.md' };

    it('detects mentions in a brand new inline comment and reply', () => {
      const newComments: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'sample text',
            anchor_hash: 'hash1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Hello @bob and @carol',
            created_at: '2026-09-01T00:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r1',
                author: 'bob',
                body: 'Thanks! CC @david',
                created_at: '2026-09-01T01:00:00Z',
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [],
      };

      const events = findNewlyMentionedEvents(null, newComments, meta);
      expect(events).toHaveLength(2);
      expect(events[0].commentId).toBe('c1');
      expect(events[0].newMentions).toEqual(['bob', 'carol']);
      expect(events[1].commentId).toBe('r1');
      expect(events[1].newMentions).toEqual(['david']);
    });

    it('does not trigger notifications for previously existing mentions when edited', () => {
      const prevComments: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'sample text',
            anchor_hash: 'hash1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Hello @bob',
            created_at: '2026-09-01T00:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'r-old',
                author: 'bob',
                body: 'Prior inline reply @alice',
                created_at: '2026-09-01T00:30:00Z',
                reactions: [],
              },
            ],
          },
        ],
        page_comments: [],
      };

      const updatedComments: CommentsFile = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'sample text',
            anchor_hash: 'hash1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Hello @bob (fixing typo) and now also @carol',
            created_at: '2026-09-01T00:00:00Z',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const events = findNewlyMentionedEvents(prevComments, updatedComments, meta);
      expect(events).toHaveLength(1);
      expect(events[0].commentId).toBe('c1');
      // Only carol should be reported as newly mentioned!
      expect(events[0].newMentions).toEqual(['carol']);
    });

    it('detects newly added mentions in page comments', () => {
      const newComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p1',
            author: 'alice',
            body: 'General review item for @eva',
            created_at: '2026-09-01T00:00:00Z',
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      const events = findNewlyMentionedEvents(null, newComments, meta);
      expect(events).toHaveLength(1);
      expect(events[0].commentId).toBe('p1');
      expect(events[0].newMentions).toEqual(['eva']);
    });

    it('detects mentions in page comments and page comment replies while ignoring prior mentions', () => {
      const prevComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p1',
            author: 'alice',
            body: 'Old page comment @bob',
            created_at: '2026-09-01T00:00:00Z',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr1',
                author: 'bob',
                body: 'Prior reply @alice',
                created_at: '2026-09-01T01:00:00Z',
                reactions: [],
              },
            ],
          },
        ],
      };

      const newComments: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'p1',
            author: 'alice',
            body: 'Old page comment @bob and new @carol',
            created_at: '2026-09-01T00:00:00Z',
            resolved: false,
            reactions: [],
            replies: [
              {
                id: 'pr1',
                author: 'bob',
                body: 'Prior reply @alice with new @david',
                created_at: '2026-09-01T01:00:00Z',
                reactions: [],
              },
            ],
          },
        ],
      };

      const events = findNewlyMentionedEvents(prevComments, newComments, meta);
      expect(events).toHaveLength(2);
      expect(events[0].commentId).toBe('p1');
      expect(events[0].newMentions).toEqual(['carol']);
      expect(events[1].commentId).toBe('pr1');
      expect(events[1].newMentions).toEqual(['david']);
    });
  });

  describe('dispatchCommitCommentNotification', () => {
    it('dispatches a commit comment to GitHub with the formatted body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 999 }),
      });

      const event: NotificationEvent = {
        commentId: 'c1',
        author: 'alice',
        body: 'Please review @bob',
        filePath: 'docs/intro.md',
        newMentions: ['bob'],
      };

      const success = await dispatchCommitCommentNotification({
        owner: 'my-org',
        repo: 'my-repo',
        commitSha: 'commit1234567',
        event,
        getToken: () => 'auth-token',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/my-org/my-repo/commits/commit1234567/comments',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token',
          }),
          body: expect.stringContaining('@alice'),
        })
      );
    });

    it('handles HTTP error gracefully without throwing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Rate limit exceeded',
      });

      const event: NotificationEvent = {
        commentId: 'c1',
        author: 'alice',
        body: 'Please review @bob',
        filePath: 'docs/intro.md',
        newMentions: ['bob'],
      };

      const success = await dispatchCommitCommentNotification({
        owner: 'my-org',
        repo: 'my-repo',
        commitSha: 'commit1234567',
        event,
        getToken: () => 'auth-token',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(success).toBe(false);
    });

    it('handles network throw gracefully without throwing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

      const event: NotificationEvent = {
        commentId: 'c2',
        author: 'alice',
        body: 'Please review @bob',
        filePath: 'docs/intro.md',
        newMentions: ['bob'],
      };

      const success = await dispatchCommitCommentNotification({
        owner: 'my-org',
        repo: 'my-repo',
        commitSha: 'commit1234567',
        event,
        getToken: () => 'auth-token',
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(success).toBe(false);
    });

    it('falls back to global fetch when fetchFn parameter is omitted', async () => {
      const origFetch = globalThis.fetch;
      const globalMockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      });
      globalThis.fetch = globalMockFetch as any;

      try {
        const event: NotificationEvent = {
          commentId: 'c3',
          author: 'alice',
          body: 'Hello @carol',
          filePath: 'docs/intro.md',
          newMentions: ['carol'],
        };

        const success = await dispatchCommitCommentNotification({
          owner: 'my-org',
          repo: 'my-repo',
          commitSha: 'commit1234567',
          event,
          getToken: () => 'token',
        });

        expect(success).toBe(true);
        expect(globalMockFetch).toHaveBeenCalled();
      } finally {
        globalThis.fetch = origFetch;
      }
    });
  });

  describe('findNewlyMentionedEvents edge cases', () => {
    it('handles comments objects where arrays or replies are undefined', () => {
      const meta = { owner: 'owner', repo: 'repo', filePath: 'docs/api.md' };
      const prevComments = {
        inline_comments: [
          {
            id: 'c1',
            author: 'alice',
            anchor_text: 'sample',
            anchor_hash: 'h1',
            paragraph_index: 0,
            heading_context: '',
            body: 'Hello @user1',
            created_at: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            // replies undefined
          } as any,
        ],
        page_comments: [
          {
            id: 'pc1',
            author: 'bob',
            body: 'Page @user2',
            created_at: '',
            resolved: false,
            reactions: [],
            // replies undefined
          } as any,
        ],
      };

      const newComments = {
        // inline_comments undefined
        page_comments: [
          {
            id: 'pc2',
            author: 'charlie',
            body: 'New page comment @newuser',
            created_at: '',
            resolved: false,
            reactions: [],
            // replies undefined
          } as any,
        ],
      };

      const events = findNewlyMentionedEvents(prevComments as any, newComments as any, meta);
      expect(events).toHaveLength(1);
      expect(events[0].newMentions).toEqual(['newuser']);
    });
  });
});
