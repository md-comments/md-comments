import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMentionQueryAtCursor,
  filterCollaborators,
  fetchCollaborators,
  clearCollaboratorCache,
  formatCommentBodyWithMentions,
  CollaboratorUser,
} from '../shared/mentions';

describe('shared/mentions', () => {
  beforeEach(() => {
    clearCollaboratorCache();
  });

  describe('getMentionQueryAtCursor', () => {
    it('returns null when cursor is out of bounds or negative', () => {
      expect(getMentionQueryAtCursor('hello', -1)).toBeNull();
      expect(getMentionQueryAtCursor('hello', 10)).toBeNull();
    });

    it('returns null when no @ symbol precedes cursor', () => {
      expect(getMentionQueryAtCursor('hello world', 5)).toBeNull();
      expect(getMentionQueryAtCursor('hello world', 11)).toBeNull();
    });

    it('returns null when @ is part of an email address', () => {
      expect(getMentionQueryAtCursor('user@example.com', 7)).toBeNull();
    });

    it('detects @ at start of input', () => {
      const res = getMentionQueryAtCursor('@', 1);
      expect(res).toEqual({
        query: '',
        start: 0,
        end: 1,
      });
    });

    it('detects @ at start of input with partial username', () => {
      const res = getMentionQueryAtCursor('@alice', 6);
      expect(res).toEqual({
        query: 'alice',
        start: 0,
        end: 6,
      });
    });

    it('detects @ preceded by a space', () => {
      const res = getMentionQueryAtCursor('Hey @bob', 8);
      expect(res).toEqual({
        query: 'bob',
        start: 4,
        end: 8,
      });
    });

    it('detects @ preceded by a newline', () => {
      const res = getMentionQueryAtCursor('First line\n@carol', 17);
      expect(res).toEqual({
        query: 'carol',
        start: 11,
        end: 17,
      });
    });

    it('handles query extraction midway through typing', () => {
      const text = 'Hello @da and more text';
      // Cursor right after @da (index 9)
      const res = getMentionQueryAtCursor(text, 9);
      expect(res).toEqual({
        query: 'da',
        start: 6,
        end: 9,
      });
    });
  });

  describe('filterCollaborators', () => {
    const mockUsers: CollaboratorUser[] = [
      { login: 'alice', name: 'Alice Smith', avatarUrl: 'https://avatar/alice' },
      { login: 'bob', name: 'Robert Jones', avatarUrl: 'https://avatar/bob' },
      { login: 'charlie', name: 'Charlie Brown', avatarUrl: 'https://avatar/charlie' },
      { login: 'david', name: 'David Miller', avatarUrl: 'https://avatar/david' },
    ];

    it('returns all users up to limit if query is empty', () => {
      const res = filterCollaborators(mockUsers, '', 2);
      expect(res).toHaveLength(2);
      expect(res[0].login).toBe('alice');
      expect(res[1].login).toBe('bob');
    });

    it('matches by login prefix first', () => {
      const res = filterCollaborators(mockUsers, 'ali');
      expect(res).toHaveLength(1);
      expect(res[0].login).toBe('alice');
    });

    it('matches by display name', () => {
      const res = filterCollaborators(mockUsers, 'robert');
      expect(res).toHaveLength(1);
      expect(res[0].login).toBe('bob');
    });

    it('is case-insensitive', () => {
      const res = filterCollaborators(mockUsers, 'CHAR');
      expect(res).toHaveLength(1);
      expect(res[0].login).toBe('charlie');
    });
  });

  describe('fetchCollaborators', () => {
    it('fetches collaborators from github endpoint and formats result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { login: 'octocat', name: 'Mona Lisa Octocat', avatar_url: 'https://octo.png' },
          { login: 'hubot', avatar_url: 'https://hubot.png' },
        ],
      });

      const users = await fetchCollaborators(
        'owner',
        'repo',
        () => 'test-token',
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/collaborators?per_page=100',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(users).toHaveLength(2);
      expect(users[0].login).toBe('octocat');
      expect(users[0].name).toBe('Mona Lisa Octocat');
      expect(users[1].login).toBe('hubot');
    });

    it('falls back to assignees if collaborators endpoint returns 403', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ login: 'assignee1' }],
        });

      const users = await fetchCollaborators(
        'owner',
        'repo',
        () => null,
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.github.com/repos/owner/repo/assignees?per_page=100',
        expect.any(Object)
      );
      expect(users).toHaveLength(1);
      expect(users[0].login).toBe('assignee1');
    });

    it('caches results on subsequent calls', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ login: 'user1' }],
      });

      await fetchCollaborators('owner', 'repo', () => null, mockFetch as unknown as typeof fetch);
      const cached = await fetchCollaborators(
        'owner',
        'repo',
        () => null,
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(cached).toHaveLength(1);
      expect(cached[0].login).toBe('user1');
    });

    it('returns cached users when subsequent fetch returns non-ok or non-array', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: true, json: async () => [{ login: 'cached-user' }] };
        }
        return { ok: false, status: 500 };
      });

      // 1. Initial success
      const first = await fetchCollaborators('cache-owner', 'repo', () => null, mockFetch as any);
      expect(first[0].login).toBe('cached-user');

      // 2. Fetch fails with non-ok, should return cached
      const fallbackOnFail = await fetchCollaborators(
        'cache-owner',
        'repo',
        () => null,
        mockFetch as any
      );
      expect(fallbackOnFail[0].login).toBe('cached-user');

      // 3. Fetch returns non-array, should return cached
      const nonArrayFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'bad data' }),
      });
      const fallbackOnNonArray = await fetchCollaborators(
        'cache-owner',
        'repo',
        () => null,
        nonArrayFetch as any
      );
      expect(fallbackOnNonArray[0].login).toBe('cached-user');
    });

    it('returns empty array when cold fetch fails on both endpoints and no cache exists', async () => {
      const failingFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const users = await fetchCollaborators(
        'cold-owner',
        'cold-repo',
        () => null,
        failingFetch as any
      );
      expect(users).toEqual([]);
    });

    it('returns empty array when cold fetch returns non-array json data and no cache exists', async () => {
      const nonArrayColdFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Not found' }),
      });

      const users = await fetchCollaborators(
        'cold-nonarray-owner',
        'cold-nonarray-repo',
        () => null,
        nonArrayColdFetch as any
      );
      expect(users).toEqual([]);
    });

    it('catches network exceptions when fetching assignees and contributors and returns fallback', async () => {
      const rejectingFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const users = await fetchCollaborators(
        'cold-throw-owner',
        'cold-throw-repo',
        () => null,
        rejectingFetch as any
      );
      expect(users).toEqual([]);
    });
  });

  describe('formatCommentBodyWithMentions', () => {
    it('returns empty string if body is empty or falsy', () => {
      expect(formatCommentBodyWithMentions('')).toBe('');
    });

    it('escapes standard HTML in comment body', () => {
      const res = formatCommentBodyWithMentions('<script>alert("xss")</script>');
      expect(res).not.toContain('<script>');
      expect(res).toContain('&lt;script&gt;');
    });

    it('converts @login into a clickable GitHub profile link', () => {
      const res = formatCommentBodyWithMentions('Hello @mstrelex please check');
      expect(res).toBe(
        'Hello <a href="https://github.com/mstrelex" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@mstrelex</a> please check'
      );
    });

    it('leaves text unchanged if isGitHubLogin returns false for matched handle', async () => {
      const authorModule = await import('../shared/author');
      const spy = vi.spyOn(authorModule, 'isGitHubLogin').mockReturnValueOnce(false);
      const res = formatCommentBodyWithMentions('Hello @invaliduser');
      expect(res).toBe('Hello @invaliduser');
      spy.mockRestore();
    });

    it('resolves @login to the person name when resolver is provided', () => {
      const resolver = (login: string) => {
        if (login === 'mstrelex') return 'Marat Strelets';
        return undefined;
      };
      const res = formatCommentBodyWithMentions('Ping @mstrelex and @other', resolver);
      expect(res).toContain(
        '<a href="https://github.com/mstrelex" class="md-comments-mention" title="@mstrelex" target="_blank" rel="noopener noreferrer">@Marat Strelets</a>'
      );
      expect(res).toContain(
        '<a href="https://github.com/other" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@other</a>'
      );
    });

    it('does not format email addresses as mentions', () => {
      const res = formatCommentBodyWithMentions('Contact user@example.com for info');
      expect(res).not.toContain('class="md-comments-mention"');
      expect(res).toContain('user@example.com');
    });

    it('handles mention at start of string and with punctuation', () => {
      const res = formatCommentBodyWithMentions('@alice, thanks!');
      expect(res).toBe(
        '<a href="https://github.com/alice" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@alice</a>, thanks!'
      );
    });

    it('handles mentions enclosed in parentheses and quotes', () => {
      const res = formatCommentBodyWithMentions('cc: (@alice) or "@bob"');
      expect(res).toContain(
        '(<a href="https://github.com/alice" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@alice</a>)'
      );
      expect(res).toContain(
        '&quot;<a href="https://github.com/bob" class="md-comments-mention" target="_blank" rel="noopener noreferrer">@bob</a>&quot;'
      );
    });
  });
});
