import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveOAuthTokens,
  getStoredTokens,
  getValidAuthToken,
  refreshAccessToken,
  clearOAuthToken,
  CLIENT_ID,
} from '../chrome-extension/src/githubAuth';

describe('Safari WebExtension Authentication & Token Lifecycle (safariAuth)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalChrome: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalBrowser: any;
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalChrome = (globalThis as any).chrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalBrowser = (globalThis as any).browser;

    // Remove chrome so it strictly behaves as Safari
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).chrome;

    // Mock global browser object for Safari
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn().mockImplementation((defaults: any) => {
            const result: Record<string, any> = {};
            for (const key of Object.keys(defaults)) {
              result[key] = mockStorage[key] !== undefined ? mockStorage[key] : defaults[key];
            }
            return Promise.resolve(result);
          }),
          set: vi.fn().mockImplementation((items: any) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
          remove: vi.fn().mockImplementation((keys: string[]) => {
            for (const k of keys) {
              delete mockStorage[k];
            }
            return Promise.resolve();
          }),
        },
      },
      runtime: {
        sendMessage: vi.fn().mockImplementation((message: any) => {
          if (message.type === 'REFRESH_ACCESS_TOKEN') {
            if (message.refreshToken === 'safari-valid-refresh-token') {
              return Promise.resolve({
                success: true,
                data: {
                  access_token: 'safari-refreshed-token-789',
                  refresh_token: 'safari-rotated-refresh-token-012',
                  expires_in: 28800,
                  refresh_token_expires_in: 15811200,
                },
              });
            } else if (message.refreshToken === 'safari-bad-token') {
              return Promise.resolve({
                success: true,
                data: {
                  error: 'bad_refresh_token',
                  error_description: 'Token has been revoked or expired.',
                },
              });
            } else {
              return Promise.resolve({ success: false, error: 'Network timeout' });
            }
          }
          return Promise.resolve({ success: false, error: 'Unknown message type' });
        }),
      },
    };
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = originalChrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).browser = originalBrowser;
    vi.restoreAllMocks();
  });

  it('persists and retrieves OAuth tokens in Safari promise-based storage', async () => {
    const before = Date.now();
    await saveOAuthTokens({
      accessToken: 'safari_access_tok_1',
      refreshToken: 'safari_refresh_tok_1',
      expiresIn: 28800,
      refreshTokenExpiresIn: 15811200,
    });
    const after = Date.now();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBe('safari_access_tok_1');
    expect(stored.refreshToken).toBe('safari_refresh_tok_1');
    expect(stored.tokenExpiresAt).toBeGreaterThanOrEqual(before + 28800 * 1000);
    expect(stored.tokenExpiresAt).toBeLessThanOrEqual(after + 28800 * 1000);
  });

  it('proactively and silently refreshes expiring tokens via Safari runtime messaging', async () => {
    mockStorage = {
      oauthToken: 'safari_old_access_token',
      refreshToken: 'safari-valid-refresh-token',
      tokenExpiresAt: Date.now() + 120 * 1000, // Expires in 2 minutes (< 5 min window)
    };

    const token = await getValidAuthToken();
    expect(token).toBe('safari-refreshed-token-789');

    // Confirm tokens were updated in storage
    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBe('safari-refreshed-token-789');
    expect(stored.refreshToken).toBe('safari-rotated-refresh-token-012');
  });

  it('clears stored credentials when Safari worker reports a rejected refresh token', async () => {
    mockStorage = {
      oauthToken: 'safari_revoked_token',
      refreshToken: 'safari-bad-token',
      tokenExpiresAt: Date.now() - 1000, // Expired
    };

    const token = await refreshAccessToken(CLIENT_ID);
    expect(token).toBeNull();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBeNull();
    expect(stored.refreshToken).toBeNull();
  });

  it('clears all session keys cleanly on clearOAuthToken', async () => {
    mockStorage = {
      oauthToken: 'safari_access_abc',
      refreshToken: 'safari_refresh_xyz',
      tokenExpiresAt: 9999999,
      refreshTokenExpiresAt: 8888888,
    };

    await clearOAuthToken();

    const stored = await getStoredTokens();
    expect(stored.oauthToken).toBeNull();
    expect(stored.refreshToken).toBeNull();
    expect(stored.tokenExpiresAt).toBeNull();
  });
});
