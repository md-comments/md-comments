import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundTelemetryManager } from '../chrome-extension/src/telemetry/otelBackground';
import { StackNormalizer, Fingerprinter, TelemetryKillSwitch } from '../shared/telemetry';

describe('Safari WebExtension Telemetry & Stack Normalization (safariTelemetry)', () => {
  let mockStorage: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globalFetchMock: any;

  beforeEach(async () => {
    mockStorage = {};
    await TelemetryKillSwitch.setEnabled(true);

    // Strictly mock Safari WebExtension `browser` namespace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).chrome;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).browser = {
      runtime: {
        sendMessage: vi.fn().mockImplementation((message: any) => {
          if (message.type === 'OTEL_LOG_RECORD') {
            return BackgroundTelemetryManager.getInstance().handleIncomingRecord(message.payload);
          }
          return Promise.resolve({ success: true });
        }),
      },
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
          remove: vi.fn().mockImplementation((key: string) => {
            delete mockStorage[key];
            return Promise.resolve();
          }),
        },
      },
    };

    globalFetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', globalFetchMock);
  });

  it('should normalize Safari JavaScriptCore stack traces to match Chrome fingerprints', () => {
    const safariStack = `renderComments@safari-web-extension://12345/dist/content.js:88:24
global code@safari-web-extension://12345/dist/content.js:150:10`;

    const { normalizedStack, topFrame } = StackNormalizer.normalize(safariStack);
    expect(normalizedStack).toContain('renderComments (dist/content.js:88)');
    expect(topFrame).toBe('renderComments (dist/content.js:88)');

    // Fingerprint parity with Chrome
    const safariFp = Fingerprinter.compute('safari-extension', 'TypeError', topFrame);
    expect(safariFp).toHaveLength(16);
  });

  it('should survive simulated WebKit service worker termination & replay queue on wake', async () => {
    // 1. Service worker receives an exception right before sleep
    globalFetchMock.mockRejectedValueOnce(new Error('WebKit Network Sleep'));

    const bgManager = BackgroundTelemetryManager.getInstance();
    await bgManager.init('https://mock-proxy.workers.dev/v1/logs');

    const err = new ReferenceError('Element not found in Safari DOM');
    await bgManager.captureWorkerException(err);

    // Verify stored in browser.storage.local
    expect(mockStorage['md_telemetry_queue']).toHaveLength(1);

    // 2. Simulate Worker wake cycle: new worker instance reads from browser.storage.local
    globalFetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await bgManager.flushQueue();

    // Verify flushed and queue cleared
    expect(mockStorage['md_telemetry_queue']).toBeUndefined();
    expect(globalFetchMock).toHaveBeenCalled();
  });
});
