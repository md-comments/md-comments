import * as vscode from 'vscode';
import { logDebug, logInfo, logError } from './logger';

const CLIENT_ID = 'Iv23li9t461keXDcVS0T';
const SECRET_KEY = 'github_oauth_token';

let secretStorage: vscode.SecretStorage | undefined;
let cachedTokenState = false;

export function initializeAuth(context: vscode.ExtensionContext): void {
  logDebug('initializeAuth called');
  secretStorage = context.secrets;
}

export function hasTokenSync(): boolean {
  return cachedTokenState;
}

/**
 * Retrieves an active GitHub OAuth token.
 * Checks VS Code native GitHub authentication provider first,
 * then falls back to stored token in SecretStorage.
 */
export async function getOAuthToken(): Promise<string | null> {
  let token: string | null = null;

  // 1. Try VS Code native GitHub authentication session
  try {
    logDebug('getOAuthToken checking VS Code native auth session');
    const session = await vscode.authentication.getSession('github', ['repo'], {
      createIfNone: false,
      silent: true,
    });
    if (session?.accessToken) {
      logDebug('getOAuthToken native session found, token length:', session.accessToken.length);
      token = session.accessToken;
    } else {
      logDebug('getOAuthToken native session not found');
    }
  } catch (err) {
    logDebug('getOAuthToken native session error:', err);
  }

  // 2. Try stored OAuth token from SecretStorage
  if (!token && secretStorage) {
    logDebug('getOAuthToken checking SecretStorage');
    const storedToken = await secretStorage.get(SECRET_KEY);
    if (storedToken) {
      logDebug('getOAuthToken SecretStorage token found, length:', storedToken.length);
      token = storedToken;
    } else {
      logDebug('getOAuthToken SecretStorage empty');
    }
  }

  cachedTokenState = !!token;
  return token;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  logDebug('requestDeviceCode initiating OAuth device flow');
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
    logError(`requestDeviceCode HTTP error: ${res.status}`);
    throw new Error(`Failed to request device code: ${res.status}`);
  }

  const data = (await res.json()) as DeviceCodeResponse;
  logDebug('requestDeviceCode response details:', {
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    interval: data.interval,
  });
  return data;
}

export async function pollForAccessToken(
  deviceCode: string,
  intervalSeconds: number = 5
): Promise<string> {
  const pollUrl = 'https://github.com/login/oauth/access_token';
  const startTime = Date.now();
  const timeoutMs = 15 * 60 * 1000; // 15 minutes timeout
  logDebug(`pollForAccessToken started, interval: ${intervalSeconds}s`);

  while (Date.now() - startTime < timeoutMs) {
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
        const data = (await res.json()) as {
          access_token?: string;
          error?: string;
          error_description?: string;
        };

        if (data.access_token) {
          logInfo('pollForAccessToken success: access token received');
          if (secretStorage) {
            await secretStorage.store(SECRET_KEY, data.access_token);
            logDebug('pollForAccessToken: saved token to secret storage');
          }
          cachedTokenState = true;
          return data.access_token;
        }

        if (
          data.error &&
          data.error !== 'authorization_pending' &&
          data.error !== 'slow_down'
        ) {
          logError(`pollForAccessToken error: ${data.error_description || data.error}`);
          throw new Error(data.error_description || data.error);
        }
        
        logDebug(`pollForAccessToken status: ${data.error || 'authorization_pending'}`);
      } else {
        logError(`pollForAccessToken HTTP non-ok status: ${res.status}`);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('authorization_pending')) {
        logError('pollForAccessToken unexpected loop error', err);
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, Math.max(intervalSeconds, 5) * 1000));
  }

  logError('pollForAccessToken timeout reached');
  throw new Error('Device code authorization timed out');
}

/**
 * Executes GitHub Sign-In via native VS Code GitHub session or OAuth Device Flow.
 */
export async function signIn(): Promise<string | null> {
  logInfo('signIn process initiated');
  // Option 1: Native VS Code GitHub Provider
  try {
    logDebug('signIn attempting native VS Code github auth provider');
    const session = await vscode.authentication.getSession('github', ['repo'], {
      createIfNone: true,
    });
    if (session?.accessToken) {
      logInfo(`signIn native success: user=${session.account.label}`);
      vscode.window.showInformationMessage(
        `Signed in to GitHub as ${session.account.label}`
      );
      cachedTokenState = true;
      return session.accessToken;
    }
  } catch (err) {
    logDebug('Native VS Code GitHub auth failed, falling back to Device Flow:', err);
  }

  // Option 2: OAuth Device Flow fallback
  try {
    logInfo('signIn falling back to OAuth Device Flow');
    const deviceData = await requestDeviceCode();
    await vscode.env.clipboard.writeText(deviceData.user_code);

    const selection = await vscode.window.showInformationMessage(
      `GitHub Device Code: ${deviceData.user_code} (Copied to clipboard). Open browser to authorize.`,
      'Open Browser',
      'Cancel'
    );

    if (selection === 'Open Browser') {
      await vscode.env.openExternal(vscode.Uri.parse(deviceData.verification_uri));
      const token = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Waiting for GitHub authorization...',
          cancellable: true,
        },
        async () => {
          return pollForAccessToken(deviceData.device_code, deviceData.interval || 5);
        }
      );

      if (token) {
        logInfo('signIn device flow completed successfully');
        vscode.window.showInformationMessage('Successfully signed in to GitHub!');
        cachedTokenState = true;
        return token;
      }
    }
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    logError('signIn device flow error', err);
    vscode.window.showErrorMessage(`GitHub Sign In failed: ${text}`);
  }

  return null;
}

/**
 * Sign out and clear stored OAuth tokens.
 */
export async function signOut(): Promise<void> {
  logInfo('signOut command executed');
  cachedTokenState = false;
  if (secretStorage) {
    await secretStorage.delete(SECRET_KEY);
    logDebug('signOut deleted stored token');
  }
  vscode.window.showInformationMessage('Signed out of GitHub');
}
