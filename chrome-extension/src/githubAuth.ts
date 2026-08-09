/**
 * GitHub Authentication Manager for Chrome Extension.
 * Supports:
 * 1. Stored OAuth token or PAT from chrome.storage.local
 * 2. OAuth Device Flow for zero-config one-time authorization
 */

const CLIENT_ID = 'Iv23li9t461keXDcVS0T'; // Markdown Comments registered GitHub App Client ID

export async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get({ fallbackToken: '', oauthToken: '' }, (items) => {
      resolve(items.oauthToken || items.fallbackToken || null);
    });
  });
}

export async function saveOAuthToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ oauthToken: token }, () => {
      resolve();
    });
  });
}

export async function clearOAuthToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['oauthToken'], () => {
      resolve();
    });
  });
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
              await saveOAuthToken(data.access_token);
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
