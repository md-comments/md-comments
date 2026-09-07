import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundTelemetryManager } from '../chrome-extension/src/telemetry/otelBackground';
import { contentTelemetry } from '../chrome-extension/src/telemetry/contentTelemetry';
import { TelemetryKillSwitch } from '../shared/telemetry';

describe('Chrome Extension Telemetry & Error Boundary (extensionTelemetry)', () => {
  let mockStorage: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globalFetchMock: any;

  beforeEach(async () => {
    mockStorage = {};
    await TelemetryKillSwitch.setEnabled(true);

    // Mock chrome namespace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = {
      runtime: {
        id: 'mjlhdjonjfcedkbpajkfeidfebefhkpp',
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

  it('should capture content script exception and forward via chrome.runtime.sendMessage', async () => {
    const bgManager = BackgroundTelemetryManager.getInstance();
    await bgManager.init('https://mock-proxy.workers.dev/v1/logs');

    contentTelemetry.recordBreadcrumb('ui', 'User clicked comment anchor');
    const err = new TypeError('Cannot read property of undefined in DOM');
    const record = await contentTelemetry.captureException(err);

    expect(record).not.toBeNull();
    expect(record?.clientInterface).toBe('chrome-extension');
    expect(record?.exception.type).toBe('TypeError');

    // Verify background manager received it and called proxy
    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = globalFetchMock.mock.calls[0];
    expect(url).toBe('https://mock-proxy.workers.dev/v1/logs');
    const parsedBody = JSON.parse(init.body);
    expect(parsedBody.resourceLogs[0].scopeLogs[0].logRecords[0].body.stringValue).toBe(
      'Cannot read property of undefined in DOM'
    );
  });

  it('should preserve queued records in chrome.storage.local if proxy is offline', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Network offline'));

    const bgManager = BackgroundTelemetryManager.getInstance();
    await bgManager.init('https://mock-proxy.workers.dev/v1/logs');

    const err = new Error('Transient error during fetch');
    await bgManager.captureWorkerException(err);

    // Should still be stored in local storage
    const queue = await bgManager.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].exception.message).toBe('Transient error during fetch');

    // Next successful flush should send and clear queue
    globalFetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await bgManager.flushQueue();

    const emptyQueue = await bgManager.getQueue();
    expect(emptyQueue).toHaveLength(0);
  });

  it('should purge persistent queue immediately when killswitch is disabled (INV-TELEMETRY-KILLSWITCH)', async () => {
    const bgManager = BackgroundTelemetryManager.getInstance();
    await bgManager.init('https://mock-proxy.workers.dev/v1/logs');

    // Add a record while offline
    globalFetchMock.mockRejectedValueOnce(new Error('Network offline'));
    await bgManager.captureWorkerException(new Error('Pending error'));
    expect(await bgManager.getQueue()).toHaveLength(1);

    // Disable telemetry
    await bgManager.setEnabled(false);

    // Queue must be purged
    expect(await bgManager.getQueue()).toHaveLength(0);
    expect(mockStorage['md_telemetry_queue']).toBeUndefined();
    expect(mockStorage['md_telemetry_enabled']).toBe(false);
  });
});
