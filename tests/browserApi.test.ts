import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getBrowserNamespace,
  browserStorage,
  browserRuntime,
} from '../chrome-extension/src/browserApi';

describe('Cross-Browser WebExtension API Abstraction (browserApi)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalChrome: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalBrowser: any;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalChrome = (globalThis as any).chrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalBrowser = (globalThis as any).browser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).chrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).browser;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = originalChrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).browser = originalBrowser;
    vi.restoreAllMocks();
  });

  describe('Namespace Resolution', () => {
    it('returns undefined when neither chrome nor browser is present', () => {
      expect(getBrowserNamespace()).toBeUndefined();
    });

    it('resolves browser when globalThis.browser is available (Safari / WebExtensions)', () => {
      const mockBrowser = { runtime: { id: 'safari-ext' } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).browser = mockBrowser;
      expect(getBrowserNamespace()).toBe(mockBrowser);
    });

    it('resolves chrome when only globalThis.chrome is available (Chromium)', () => {
      const mockChrome = { runtime: { id: 'chrome-ext' } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).chrome = mockChrome;
      expect(getBrowserNamespace()).toBe(mockChrome);
    });

    it('prefers browser over chrome when both are defined', () => {
      const mockBrowser = { runtime: { id: 'safari-ext' } };
      const mockChrome = { runtime: { id: 'chrome-ext' } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).browser = mockBrowser;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).chrome = mockChrome;
      expect(getBrowserNamespace()).toBe(mockBrowser);
    });
  });

  describe('browserStorage in Safari (Promise-based)', () => {
    it('performs get, set, and remove using native promises', async () => {
      const store: Record<string, any> = { token: 'safari-token-123' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).browser = {
        runtime: { id: 'safari' },
        storage: {
          local: {
            get: vi.fn().mockImplementation((keys) => {
              if (typeof keys === 'object' && !Array.isArray(keys)) {
                return Promise.resolve({ ...keys, ...store });
              }
              return Promise.resolve(store);
            }),
            set: vi.fn().mockImplementation((items) => {
              Object.assign(store, items);
              return Promise.resolve();
            }),
            remove: vi.fn().mockImplementation((keys) => {
              const kList = Array.isArray(keys) ? keys : [keys];
              kList.forEach((k) => delete store[k]);
              return Promise.resolve();
            }),
          },
          onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
        },
      };

      const result = await browserStorage.get<{ token: string }>({ token: '' });
      expect(result.token).toBe('safari-token-123');

      await browserStorage.set({ theme: 'dark' });
      expect(store.theme).toBe('dark');

      await browserStorage.remove('theme');
      expect(store.theme).toBeUndefined();
    });
  });

  describe('browserStorage in Chrome (Callback-based)', () => {
    it('performs get, set, and remove using standard callbacks', async () => {
      const store: Record<string, any> = { oauthToken: 'chrome-token-456' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).chrome = {
        runtime: { id: 'chrome' },
        storage: {
          local: {
            get: vi.fn().mockImplementation((keys, cb) => {
              cb({ oauthToken: store.oauthToken });
            }),
            set: vi.fn().mockImplementation((items, cb) => {
              Object.assign(store, items);
              cb();
            }),
            remove: vi.fn().mockImplementation((keys, cb) => {
              const kList = Array.isArray(keys) ? keys : [keys];
              kList.forEach((k) => delete store[k]);
              cb();
            }),
          },
          onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
        },
      };

      const result = await browserStorage.get<{ oauthToken: string }>({ oauthToken: '' });
      expect(result.oauthToken).toBe('chrome-token-456');

      await browserStorage.set({ user: 'octocat' });
      expect(store.user).toBe('octocat');

      await browserStorage.remove('user');
      expect(store.user).toBeUndefined();
    });

    it('returns default fallback values when storage is not available', async () => {
      const result = await browserStorage.get<{ defaultValue: string }>({
        defaultValue: 'default',
      });
      expect(result.defaultValue).toBe('default');
    });
  });

  describe('browserRuntime', () => {
    it('resolves getURL using extension namespace or fallback', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).browser = {
        runtime: {
          getURL: (path: string) => `safari-extension://mock-id/${path}`,
        },
      };

      expect(browserRuntime.getURL('sidebar.css')).toBe('safari-extension://mock-id/sidebar.css');

      // Test fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).browser;
      expect(browserRuntime.getURL('sidebar.css')).toBe('sidebar.css');
    });

    it('sends messages with Promise support in Safari', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).browser = {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({ success: true, userCode: '1234-5678' }),
        },
      };

      const res = await browserRuntime.sendMessage({ type: 'START_DEVICE_FLOW' });
      expect(res.success).toBe(true);
      expect(res.userCode).toBe('1234-5678');
    });

    it('sends messages with callback support in Chrome', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).chrome = {
        runtime: {
          sendMessage: vi.fn().mockImplementation((msg, cb) => {
            cb({ success: true, token: 'gho_abc' });
          }),
        },
      };

      const res = await browserRuntime.sendMessage({ type: 'CHECK_DEVICE_TOKEN' });
      expect(res.success).toBe(true);
      expect(res.token).toBe('gho_abc');
    });

    it('handles runtime.lastError rejections cleanly', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).chrome = {
        runtime: {
          lastError: { message: 'Receiving end does not exist' },
          sendMessage: vi.fn().mockImplementation((msg, cb) => {
            cb(undefined);
          }),
        },
      };

      await expect(browserRuntime.sendMessage({ type: 'PING' })).rejects.toThrow(
        'Receiving end does not exist'
      );
    });
  });
});
