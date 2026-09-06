/**
 * GitHub Authentication Manager for Chrome Extension.
 * Supports:
 * 1. Stored OAuth token or PAT from chrome.storage.local
 * 2. OAuth Device Flow for zero-config one-time authorization
 */

export const CLIENT_ID = 'Iv23li9t461keXDcVS0T'; // Markdown Comments registered GitHub App Client ID

export interface StoredTokens {
  oauthToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  fallbackToken: string | null;
}

export interface SaveTokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
}

export async function getStoredTokens(): Promise<StoredTokens> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      {
        fallbackToken: '',
        oauthToken: '',
        refreshToken: '',
        tokenExpiresAt: 0,
        refreshTokenExpiresAt: 0,
      },
      (items) => {
        resolve({
          oauthToken: items.oauthToken || null,
          refreshToken: items.refreshToken || null,
          tokenExpiresAt: items.tokenExpiresAt || null,
          refreshTokenExpiresAt: items.refreshTokenExpiresAt || null,
          fallbackToken: items.fallbackToken || null,
        });
      }
    );
  });
}

export async function getStoredToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  return tokens.oauthToken || tokens.fallbackToken || null;
}

export async function saveOAuthTokens(payload: SaveTokenPayload): Promise<void> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {
      oauthToken: payload.accessToken,
    };
    if (payload.refreshToken) {
      data.refreshToken = payload.refreshToken;
    }
    if (payload.expiresIn) {
      // Expiration in ms
      data.tokenExpiresAt = Date.now() + payload.expiresIn * 1000;
    }
    if (payload.refreshTokenExpiresIn) {
      // Refresh token expiration in ms
      data.refreshTokenExpiresAt = Date.now() + payload.refreshTokenExpiresIn * 1000;
    }
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

export async function saveOAuthToken(token: string): Promise<void> {
  return saveOAuthTokens({ accessToken: token });
}

export async function clearOAuthToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(
      ['oauthToken', 'refreshToken', 'tokenExpiresAt', 'refreshTokenExpiresAt'],
      () => {
        resolve();
      }
    );
  });
}

export async function refreshAccessToken(clientId: string = CLIENT_ID): Promise<string | null> {
  const { refreshToken } = await getStoredTokens();
  if (!refreshToken) {
    console.warn('[githubAuth] Cannot refresh token: no refresh_token stored.');
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        {
          type: 'REFRESH_ACCESS_TOKEN',
          clientId,
          refreshToken,
        },
        async (response) => {
          if (chrome.runtime.lastError) {
            console.error('[githubAuth] Refresh message error:', chrome.runtime.lastError);
            resolve(null);
            return;
          }

          if (response && response.success && response.data) {
            const data = response.data;
            if (data.access_token) {
              console.log('[githubAuth] Token refreshed successfully!');
              await saveOAuthTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token, // Rotated refresh token
                expiresIn: data.expires_in,
                refreshTokenExpiresIn: data.refresh_token_expires_in,
              });
              resolve(data.access_token);
              return;
            } else if (data.error) {
              console.warn('[githubAuth] Refresh token rejected by GitHub:', data.error);
              if (data.error === 'bad_refresh_token' || data.error === 'invalid_grant') {
                await clearOAuthToken();
              }
              resolve(null);
              return;
            }
          }
          console.warn('[githubAuth] Token refresh failed:', response?.error);
          resolve(null);
        }
      );
    } catch (err) {
      console.error('[githubAuth] Error invoking token refresh:', err);
      resolve(null);
    }
  });
}

export async function getValidAuthToken(clientId: string = CLIENT_ID): Promise<string | null> {
  const tokens = await getStoredTokens();

  if (tokens.oauthToken) {
    // Proactively refresh if token expires within 5 minutes (300,000 ms)
    const isExpiringSoon = tokens.tokenExpiresAt && Date.now() >= tokens.tokenExpiresAt - 300000;

    if (isExpiringSoon && tokens.refreshToken) {
      console.log('[githubAuth] Access token is expiring or expired. Silently refreshing...');
      const newToken = await refreshAccessToken(clientId);
      if (newToken) {
        return newToken;
      }
    }
    return tokens.oauthToken;
  }

  return tokens.fallbackToken || null;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

/**
 * Initiates the GitHub OAuth Device Flow.
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: 'public_repo repo',
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to request device code: ${res.status}`);
  }

  return res.json();
}

/**
 * Polls GitHub for the OAuth access token after user enters code.
 */
export async function pollForAccessToken(
  deviceCode: string,
  intervalSeconds: number = 5
): Promise<string> {
  const pollUrl = 'https://github.com/login/oauth/access_token';

  return new Promise((resolve, reject) => {
    const timer = setInterval(
      async () => {
        try {
          const res = await fetch(pollUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: CLIENT_ID,
              device_code: deviceCode,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.access_token) {
              clearInterval(timer);
              await saveOAuthTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                refreshTokenExpiresIn: data.refresh_token_expires_in,
              });
              resolve(data.access_token);
            } else if (
              data.error &&
              data.error !== 'authorization_pending' &&
              data.error !== 'slow_down'
            ) {
              clearInterval(timer);
              reject(new Error(data.error_description || data.error));
            }
          }
        } catch (err) {
          clearInterval(timer);
          reject(err);
        }
      },
      Math.max(intervalSeconds, 5) * 1000
    );
  });
}

/**
 * Executes the complete OAuth Device Flow.
 */
export async function startOAuthDeviceFlow(
  onCodeReceived?: (userCode: string, verificationUri: string) => void
): Promise<string> {
  const deviceData = await requestDeviceCode();
  if (onCodeReceived) {
    onCodeReceived(deviceData.user_code, deviceData.verification_uri);
  } else {
    window.open(deviceData.verification_uri, '_blank');
  }
  return pollForAccessToken(deviceData.device_code, deviceData.interval || 5);
}
