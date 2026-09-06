/**
 * Unified Cross-Browser WebExtension API Abstraction Layer.
 * Provides uniform Promise-based storage, runtime messaging, and resource helpers
 * across Google Chrome (Chromium) and Apple Safari (WebKit) environments.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericRecord = Record<string, any>;

/**
 * Resolves the underlying browser extension API namespace.
 * Uses global `browser` if available (Safari / Firefox), falling back to `chrome`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBrowserNamespace(): any {
  if (typeof globalThis !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (typeof g.browser !== 'undefined' && g.browser?.runtime) {
      return g.browser;
    }
    if (typeof g.chrome !== 'undefined' && g.chrome?.runtime) {
      return g.chrome;
    }
  }
  return undefined;
}

export const browserStorage = {
  /**
   * Retrieves items from local storage with Promise support.
   */
  async get<T = GenericRecord>(keys: string | string[] | GenericRecord): Promise<T> {
    const api = getBrowserNamespace();
    if (!api?.storage?.local) {
      return (typeof keys === 'object' && !Array.isArray(keys) ? { ...keys } : {}) as T;
    }

    // Try promise-based API first (standard WebExtensions / Safari)
    try {
      const promiseResult = api.storage.local.get(keys);
      if (promiseResult && typeof promiseResult.then === 'function') {
        return (await promiseResult) as T;
      }
    } catch {
      // Fall through to callback pattern
    }

    // Callback-based fallback (traditional Chrome)
    return new Promise((resolve) => {
      api.storage.local.get(keys, (items: T) => {
        resolve(items);
      });
    });
  },

  /**
   * Stores items in local storage with Promise support.
   */
  async set(items: GenericRecord): Promise<void> {
    const api = getBrowserNamespace();
    if (!api?.storage?.local) return;

    try {
      const promiseResult = api.storage.local.set(items);
      if (promiseResult && typeof promiseResult.then === 'function') {
        await promiseResult;
        return;
      }
    } catch {
      // Fall through to callback pattern
    }

    return new Promise((resolve) => {
      api.storage.local.set(items, () => {
        resolve();
      });
    });
  },

  /**
   * Removes items from local storage with Promise support.
   */
  async remove(keys: string | string[]): Promise<void> {
    const api = getBrowserNamespace();
    if (!api?.storage?.local) return;

    try {
      const promiseResult = api.storage.local.remove(keys);
      if (promiseResult && typeof promiseResult.then === 'function') {
        await promiseResult;
        return;
      }
    } catch {
      // Fall through to callback pattern
    }

    return new Promise((resolve) => {
      api.storage.local.remove(keys, () => {
        resolve();
      });
    });
  },

  /**
   * Storage change event listener registration.
   */
  onChanged: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addListener(callback: (changes: GenericRecord, areaName: string) => void): void {
      const api = getBrowserNamespace();
      if (api?.storage?.onChanged?.addListener) {
        api.storage.onChanged.addListener(callback);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeListener(callback: (changes: GenericRecord, areaName: string) => void): void {
      const api = getBrowserNamespace();
      if (api?.storage?.onChanged?.removeListener) {
        api.storage.onChanged.removeListener(callback);
      }
    },
  },
};

export const browserRuntime = {
  /**
   * Resolves a relative extension path to a fully qualified URL.
   */
  getURL(path: string): string {
    const api = getBrowserNamespace();
    if (api?.runtime?.getURL) {
      return api.runtime.getURL(path);
    }
    return path;
  },

  /**
   * Sends a message to the extension background service worker with Promise support.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendMessage<T = any>(message: any): Promise<T> {
    const api = getBrowserNamespace();
    if (!api?.runtime?.sendMessage) {
      throw new Error('Extension runtime messaging API unavailable');
    }

    return new Promise((resolve, reject) => {
      let callbackCalled = false;

      try {
        const maybePromise = api.runtime.sendMessage(message, (response: T) => {
          callbackCalled = true;
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message || String(api.runtime.lastError)));
          } else {
            resolve(response);
          }
        });

        // If a promise was returned and callback was not synchronously called, listen to promise
        if (maybePromise && typeof maybePromise.then === 'function' && !callbackCalled) {
          maybePromise
            .then((res: T) => {
              if (!callbackCalled) resolve(res);
            })
            .catch((err: unknown) => {
              if (!callbackCalled) reject(err);
            });
        }
      } catch (err) {
        // If calling with callback threw (e.g. strict Safari promise-only signature)
        try {
          const promiseResult = api.runtime.sendMessage(message);
          if (promiseResult && typeof promiseResult.then === 'function') {
            promiseResult.then(resolve).catch(reject);
            return;
          }
        } catch {
          // Re-throw original error
        }
        reject(err);
      }
    });
  },

  /**
   * Runtime message listener registration.
   */
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (res?: unknown) => void
      ) => boolean | void
    ): void {
      const api = getBrowserNamespace();
      if (api?.runtime?.onMessage?.addListener) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.runtime.onMessage.addListener(callback as any);
      }
    },
    removeListener(
      callback: (message: unknown, sender: unknown, sendResponse: (res?: unknown) => void) => void
    ): void {
      const api = getBrowserNamespace();
      if (api?.runtime?.onMessage?.removeListener) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.runtime.onMessage.removeListener(callback as any);
      }
    },
  },
};
