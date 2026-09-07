/**
 * Service Worker Background Script for Cross-Browser Extension (Chrome & Safari).
 * Handles CORS-free GitHub App Device Flow.
 */

import { getBrowserNamespace } from './browserApi';
import { backgroundTelemetry } from './telemetry/otelBackground';
import type { TelemetryRecord } from '../../shared/telemetry';

const DEFAULT_CLIENT_ID = 'Iv23li9t461keXDcVS0T';

// Initialize background telemetry and error handlers
backgroundTelemetry.init().catch((err) => {
  console.warn('[background.js] Failed to initialize telemetry:', err);
});

const api = getBrowserNamespace();
const runtime = api?.runtime || (typeof chrome !== 'undefined' ? chrome.runtime : undefined);

interface ExtensionMessage {
  type?: string;
  clientId?: string;
  deviceCode?: string;
  refreshToken?: string;
  payload?: Record<string, unknown>;
  enabled?: boolean;
}

runtime?.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (res?: Record<string, unknown>) => void
  ) => {
    if (message.type === 'OTEL_LOG_RECORD' && message.payload) {
      backgroundTelemetry
        .handleIncomingRecord(message.payload as unknown as TelemetryRecord)
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true;
    }

    if (message.type === 'OTEL_SET_ENABLED') {
      backgroundTelemetry
        .setEnabled(Boolean(message.enabled))
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true;
    }

    if (message.type === 'OTEL_FLUSH') {
      backgroundTelemetry
        .flushQueue()
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));
      return true;
    }

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
      checkDeviceToken(message.clientId || DEFAULT_CLIENT_ID, message.deviceCode || '')
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

    if (message.type === 'REFRESH_ACCESS_TOKEN') {
      console.log('[background.js] Received REFRESH_ACCESS_TOKEN message');
      refreshDeviceToken(message.clientId || DEFAULT_CLIENT_ID, message.refreshToken || '')
        .then((res) => {
          console.log('[background.js] REFRESH_ACCESS_TOKEN response payload:', res);
          sendResponse({ success: true, data: res });
        })
        .catch((err) => {
          console.error('[background.js] REFRESH_ACCESS_TOKEN error:', err);
          sendResponse({ success: false, error: String(err?.message || err) });
        });
      return true; // Keep channel open for async response
    }
  }
);

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
    const err = deviceData as { error_description?: string; error?: string };
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

async function refreshDeviceToken(clientId: string, refreshToken: string) {
  console.log('[background.js] Sending token refresh request to GitHub...');
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed with status ${res.status}`);
  }

  return await res.json();
}
