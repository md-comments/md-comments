/**
 * Service Worker Background Script for Chrome Extension.
 * Handles CORS-free GitHub App Device Flow.
 */

const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_DEVICE_FLOW') {
    console.log('[background.js] Received START_DEVICE_FLOW message');
    handleDeviceFlow(message.clientId || DEFAULT_CLIENT_ID)
      .then((res) => {
        console.log('[background.js] Device flow started successfully:', res);
        sendResponse({ success: true, ...res });
      })
      .catch((err) => {
        console.error('[background.js] START_DEVICE_FLOW error:', err);
        sendResponse({ success: false, error: String(err?.message || err) });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === 'CHECK_DEVICE_TOKEN') {
    console.log(
      '[background.js] Received CHECK_DEVICE_TOKEN message for code:',
      message.deviceCode
    );
    checkDeviceToken(message.clientId || DEFAULT_CLIENT_ID, message.deviceCode)
      .then((res) => {
        console.log('[background.js] CHECK_DEVICE_TOKEN response payload:', res);
        sendResponse({ success: true, data: res });
      })
      .catch((err) => {
        console.error('[background.js] CHECK_DEVICE_TOKEN error:', err);
        sendResponse({ success: false, error: String(err?.message || err) });
      });
    return true; // Keep channel open for async response
  }
});

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

async function handleDeviceFlow(clientId: string) {
  console.log('[background.js] Requesting device code for client:', clientId);
  const deviceRes = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId }),
  });

  if (!deviceRes.ok) {
    throw new Error(`GitHub returned status ${deviceRes.status} when requesting device code.`);
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;
  if ('error' in deviceData) {
    const err = deviceData as any;
    throw new Error(err.error_description || err.error);
  }

  return {
    deviceCode: deviceData.device_code,
    userCode: deviceData.user_code,
    verificationUri: deviceData.verification_uri,
    interval: deviceData.interval || 5,
  };
}

async function checkDeviceToken(clientId: string, deviceCode: string) {
  console.log('[background.js] Sending token exchange request to GitHub...');
  const res = await fetch('https://github.com/login/oauth/access_token', {
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

  if (!res.ok) {
    throw new Error(`Token exchange failed with status ${res.status}`);
  }

  return await res.json();
}
