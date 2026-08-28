/**
 * Client-Side GitHub Authentication Manager for Astro/Starlight.
 * Supports GitHub OAuth Device Flow (proxied or direct).
 */

export const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';
const STORAGE_KEY = 'md_comments_oauth_token';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

export interface DeviceCodeResult {
  data: DeviceCodeResponse;
  pollUrl: string;
}

export interface GitHubViewer {
  login: string;
  name?: string;
  avatar_url: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveOAuthToken(token: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, token.trim());
  } catch {
    /* ignore */
  }
}

export function clearOAuthToken(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Initiates the GitHub OAuth Device Flow.
 * Tries custom proxy URL, local dev server proxy, or direct GitHub endpoint with CORS error guidance.
 */
export async function requestDeviceCode(
  clientId: string = DEFAULT_CLIENT_ID,
  authProxyUrl?: string
): Promise<DeviceCodeResult> {
  // 1. If explicit authProxyUrl is specified in options
  if (authProxyUrl) {
    const base = authProxyUrl.replace(/\/+$/, '');
    const res = await fetch(`${base}/device-code`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        scope: 'public_repo repo',
      }),
    });
    if (!res.ok) {
      throw new Error(`Auth proxy error (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return { data, pollUrl: `${base}/access-token` };
  }

  // 2. Try local dev server proxy endpoints (under root and current base path)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const basePath = pathParts.length > 0 ? `/${pathParts[0]}` : '';

    const candidates = [
      '/api/md-comments/auth/device-code',
      `${basePath}/api/md-comments/auth/device-code`,
      `${origin}/api/md-comments/auth/device-code`,
      `${origin}${basePath}/api/md-comments/auth/device-code`,
    ];

    const uniqueEndpoints = Array.from(new Set(candidates));

    for (const endpoint of uniqueEndpoints) {
      try {
        const devRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            scope: 'public_repo repo',
          }),
        });
        if (devRes.ok) {
          const data = await devRes.json();
          if (data.device_code) {
            const pollUrl = endpoint.replace('device-code', 'access-token');
            return {
              data,
              pollUrl,
            };
          }
        }
      } catch {
        // Local dev proxy not responsive on this endpoint, continue
      }
    }
  }

  // 3. Fallback: Direct GitHub Device Code request
  try {
    const res = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        scope: 'public_repo repo',
      }),
    });

    if (!res.ok) {
      throw new Error(`GitHub returned status: ${res.status}`);
    }

    const data = await res.json();
    return { data, pollUrl: 'https://github.com/login/oauth/access_token' };
  } catch (err: any) {
    if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      throw new Error(
        'GitHub Device OAuth was blocked by browser CORS. Please configure an authProxyUrl in plugin options or run in local dev mode.'
      );
    }
    throw err;
  }
}

/**
 * Polls for the OAuth access token after user authorizes code.
 * Implements exponential backoff and GitHub slow_down RFC interval increments.
 */
export async function pollForAccessToken(
  deviceCode: string,
  clientId: string = DEFAULT_CLIENT_ID,
  intervalSeconds: number = 5,
  onStatusChange?: (status: string) => void,
  pollUrl: string = 'https://github.com/login/oauth/access_token',
  shouldStop?: () => boolean
): Promise<string> {
  let currentInterval = Math.max(intervalSeconds || 5, 5);
  const startTime = Date.now();
  const timeoutMs = 15 * 60 * 1000; // 15 minutes max

  while (Date.now() - startTime < timeoutMs) {
    if (shouldStop && shouldStop()) {
      throw new Error('Authorization cancelled');
    }

    // Wait for the current interval before polling
    await new Promise((resolve) => setTimeout(resolve, currentInterval * 1000));

    if (shouldStop && shouldStop()) {
      throw new Error('Authorization cancelled');
    }

    try {
      const res = await fetch(pollUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response, retry next cycle
      }

      if (data.access_token) {
        saveOAuthToken(data.access_token);
        if (onStatusChange) onStatusChange('authorized');
        return data.access_token;
      }

      if (data.error === 'authorization_pending') {
        if (onStatusChange) onStatusChange('pending');
      } else if (data.error === 'slow_down') {
        // GitHub RFC: When slow_down occurs, add 5 seconds to minimum polling interval
        currentInterval = (data.interval ? Number(data.interval) : currentInterval) + 5;
        if (onStatusChange) onStatusChange('slow_down');
      } else if (data.error === 'expired_token') {
        throw new Error('Device authorization code expired. Please sign in again.');
      } else if (data.error === 'access_denied') {
        throw new Error('Authorization cancelled on GitHub.');
      } else if (data.error && data.error !== 'authorization_pending') {
        throw new Error(data.error_description || data.error);
      }
    } catch (err: any) {
      if (err?.message?.includes('cancelled') || err?.message?.includes('expired') || err?.message?.includes('denied')) {
        throw err;
      }
      // Transient error, continue loop
    }
  }

  throw new Error('Device code authorization timed out. Please try again.');
}

/**
 * Fetches current authenticated user info.
 */
export async function getViewer(token: string): Promise<GitHubViewer | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        login: data.login,
        name: data.name,
        avatar_url: data.avatar_url,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

