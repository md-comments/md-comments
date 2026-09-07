import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveOAuthTokens,
  getStoredTokens,
  getValidAuthToken,
  refreshAccessToken,
  clearOAuthToken,
  CLIENT_ID,
} from '../chrome-extension/src/githubAuth';

describe('chrome-extension/githubAuth', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};

    // Mock global chrome object
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn((defaults: any, callback: (items: any) => void) => {
            const result: Record<string, any> = {};
            for (const key of Object.keys(defaults)) {
              result[key] = mockStorage[key] !== undefined ? mockStorage[key] : defaults[key];
            }
            callback(result);
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
      },
      runtime: {
        lastError: null,
        sendMessage: vi.fn((message: any, callback?: (response: any) => void) => {
          if (message.type === 'REFRESH_ACCESS_TOKEN') {
            if (message.refreshToken === 'valid-refresh-token') {
              if (callback) {
                callback({
                  success: true,
                  data: {
                    access_token: 'new-access-token-123',
                    refresh_token: 'new-refresh-token-456',
                    expires_in: 28800,
                    refresh_token_expires_in: 15811200,
                  },
                });
              }
            } else if (message.refreshToken === 'revoked-refresh-token') {
              if (callback) {
                callback({
                  success: true,
                  data: {
                    error: 'bad_refresh_token',
                    error_description: 'The refresh token is invalid.',
                  },
                });
              }
            } else {
              if (callback) {
                callback({ success: false, error: 'Network error' });
              }
            }
          }
        }),
      },
    };
  });

  it('saves access token, refresh token, and computed expirations', async () => {
    const before = Date.now();
    await saveOAuthTokens({
      accessToken: 'ghu_access_token_1',
      refreshToken: 'ghr_refresh_token_1',
      expiresIn: 28800, // 8 hours
      refreshTokenExpiresIn: 15811200, // ~6 months
    });
    const after = Date.now();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBe('ghu_access_token_1');
    expect(stored.refreshToken).toBe('ghr_refresh_token_1');
    expect(stored.tokenExpiresAt).toBeGreaterThanOrEqual(before + 28800 * 1000);
    expect(stored.tokenExpiresAt).toBeLessThanOrEqual(after + 28800 * 1000);
    expect(stored.refreshTokenExpiresAt).toBeGreaterThanOrEqual(before + 15811200 * 1000);
  });

  it('clears all token keys on clearOAuthToken', async () => {
    mockStorage = {
      oauthToken: 'old-access',
      refreshToken: 'old-refresh',
      tokenExpiresAt: 12345,
      refreshTokenExpiresAt: 67890,
      fallbackToken: 'pat-123',
    };

    await clearOAuthToken();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBeNull();
    expect(stored.refreshToken).toBeNull();
    expect(stored.tokenExpiresAt).toBeNull();
    expect(stored.refreshTokenExpiresAt).toBeNull();
    // Fallback PAT is preserved
    expect(stored.fallbackToken).toBe('pat-123');
  });

  it('returns valid access token directly when token has not expired', async () => {
    mockStorage = {
      oauthToken: 'fresh-token',
      refreshToken: 'valid-refresh-token',
      tokenExpiresAt: Date.now() + 3600 * 1000, // 1 hour left
    };

    const token = await getValidAuthToken();
    expect(token).toBe('fresh-token');
    expect(chrome.runtime.sendMessage as any).not.toHaveBeenCalled();
  });

  it('proactively refreshes token when token is expiring within 5 minutes', async () => {
    mockStorage = {
      oauthToken: 'expiring-token',
      refreshToken: 'valid-refresh-token',
      tokenExpiresAt: Date.now() + 60 * 1000, // 1 minute left (within 5min buffer)
    };

    const token = await getValidAuthToken();
    expect(token).toBe('new-access-token-123');
    expect(chrome.runtime.sendMessage as any).toHaveBeenCalledWith(
      {
        type: 'REFRESH_ACCESS_TOKEN',
        clientId: CLIENT_ID,
        refreshToken: 'valid-refresh-token',
      },
      expect.any(Function)
    );

    // Stored tokens should now have rotated refresh token
    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBe('new-access-token-123');
    expect(stored.refreshToken).toBe('new-refresh-token-456');
  });

  it('clears credentials when refresh token is rejected (bad_refresh_token)', async () => {
    mockStorage = {
      oauthToken: 'expired-token',
      refreshToken: 'revoked-refresh-token',
      tokenExpiresAt: Date.now() - 1000, // already expired
    };

    const refreshed = await refreshAccessToken();
    expect(refreshed).toBeNull();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBeNull();
    expect(stored.refreshToken).toBeNull();
  });

  it('falls back to fallbackToken if no oauthToken exists', async () => {
    mockStorage = {
      fallbackToken: 'personal-access-token-xyz',
    };

    const token = await getValidAuthToken();
    expect(token).toBe('personal-access-token-xyz');
  });
});

describe('chrome-extension/githubApi checkAppInstallation', () => {
  it('caches installation status and invalidates with forceRefresh', async () => {
    const { GitHubApi } = await import('../chrome-extension/src/githubApi');
    const api = new GitHubApi('fake-token');

    let callCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: string) => {
      callCount++;
      if (url.includes('/user/installations')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            installations: [
              {
                id: 101,
                account: { login: 'octocat' },
                repository_selection: 'all',
                app_slug: 'markdown-comments',
              },
            ],
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    }) as any;

    try {
      // First call: fetches from API
      const res1 = await api.checkAppInstallation('octocat', 'hello-world');
      expect(res1.installed).toBe(true);
      expect(res1.repoAccess).toBe(true);
      expect(res1.installationId).toBe(101);
      expect(callCount).toBe(1);

      // Second call: served from cache
      const res2 = await api.checkAppInstallation('octocat', 'hello-world');
      expect(res2.installed).toBe(true);
      expect(callCount).toBe(1);

      // Third call with forceRefresh: true fetches from API
      const res3 = await api.checkAppInstallation('octocat', 'hello-world', true);
      expect(res3.installed).toBe(true);
      expect(callCount).toBe(2);

      // Fourth call after clearAppInstallationCache: fetches from API
      api.clearAppInstallationCache('octocat', 'hello-world');
      const res4 = await api.checkAppInstallation('octocat', 'hello-world');
      expect(res4.installed).toBe(true);
      expect(callCount).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns installed: false when no installation exists for owner', async () => {
    const { GitHubApi } = await import('../chrome-extension/src/githubApi');
    const api = new GitHubApi('fake-token');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        installations: [
          {
            id: 201,
            account: { login: 'other-user' },
            repository_selection: 'all',
            app_slug: 'markdown-comments',
          },
        ],
      }),
    })) as any;

    try {
      const res = await api.checkAppInstallation('target-user', 'some-repo');
      expect(res.installed).toBe(false);
      expect(res.repoAccess).toBe(false);
      expect(res.appSlug).toBe('markdown-comments');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('evaluates selected repository access correctly', async () => {
    const { GitHubApi } = await import('../chrome-extension/src/githubApi');
    const api = new GitHubApi('fake-token');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: string) => {
      if (url.includes('/user/installations/301/repositories')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            repositories: [{ name: 'allowed-repo' }],
          }),
        } as any;
      }
      if (url.includes('/user/installations')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            installations: [
              {
                id: 301,
                account: { login: 'octocat' },
                repository_selection: 'selected',
                app_slug: 'markdown-comments',
              },
            ],
          }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    }) as any;

    try {
      // Allowed repo has repoAccess: true
      const resAllowed = await api.checkAppInstallation('octocat', 'allowed-repo');
      expect(resAllowed.installed).toBe(true);
      expect(resAllowed.repoAccess).toBe(true);
      expect(resAllowed.installationId).toBe(301);

      // Disallowed repo has repoAccess: false
      const resDisallowed = await api.checkAppInstallation('octocat', 'forbidden-repo');
      expect(resDisallowed.installed).toBe(true);
      expect(resDisallowed.repoAccess).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('gracefully handles API network error with fail-open fallback', async () => {
    const { GitHubApi } = await import('../chrome-extension/src/githubApi');
    const api = new GitHubApi('fake-token');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Network error');
    }) as any;

    try {
      const res = await api.checkAppInstallation('octocat', 'network-error-repo');
      // Fail-open strategy prevents blocking users when the installations API errors out
      expect(res.installed).toBe(true);
      expect(res.repoAccess).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
