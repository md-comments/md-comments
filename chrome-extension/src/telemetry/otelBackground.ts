/**
 * Service Worker Background Telemetry Engine (Chrome & Safari MV3)
 * Collects records from content scripts and worker lifecycle, manages persistent offline queue
 * in browserStorage.local, and exports to Cloudflare proxy with Zero Client Secrets.
 */

import { browserStorage } from '../browserApi';
import { TelemetryRecord } from '../../../shared/src/telemetry/otelTypes';
import { TelemetryKillSwitch } from '../../../shared/src/telemetry/killswitch';
import { UniversalSanitizer } from '../../../shared/src/telemetry/sanitizer';
import { StackNormalizer } from '../../../shared/src/telemetry/stackNormalizer';
import { Fingerprinter } from '../../../shared/src/telemetry/fingerprinter';

const STORAGE_QUEUE_KEY = 'md_telemetry_queue';
const SETTING_TELEMETRY_ENABLED_KEY = 'md_telemetry_enabled';
const MAX_QUEUE_SIZE = 100;
export const DEFAULT_PROXY_ENDPOINT =
  'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs';

export class BackgroundTelemetryManager {
  private static instance: BackgroundTelemetryManager;
  private endpointUrl: string = DEFAULT_PROXY_ENDPOINT;
  private isFlushing: boolean = false;
  private initialized: boolean = false;
  private clientInterface: 'chrome-extension' | 'safari-extension';

  private constructor() {
    const isSafari =
      typeof globalThis !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((globalThis as any).browser?.runtime && !(globalThis as any).chrome?.runtime?.id);
    this.clientInterface = isSafari ? 'safari-extension' : 'chrome-extension';
  }

  public static getInstance(): BackgroundTelemetryManager {
    if (!BackgroundTelemetryManager.instance) {
      BackgroundTelemetryManager.instance = new BackgroundTelemetryManager();
    }
    return BackgroundTelemetryManager.instance;
  }

  public async init(customEndpoint?: string): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (customEndpoint) {
      this.endpointUrl = customEndpoint;
    }

    // 1. Sync enabled state from storage
    const settings = await browserStorage.get<{ [SETTING_TELEMETRY_ENABLED_KEY]?: boolean }>({
      [SETTING_TELEMETRY_ENABLED_KEY]: true,
    });

    const isEnabled = settings[SETTING_TELEMETRY_ENABLED_KEY] ?? true;
    await TelemetryKillSwitch.setEnabled(isEnabled);

    // Register purge callback for instant local storage cleanup (INV-TELEMETRY-KILLSWITCH)
    TelemetryKillSwitch.onPurge(async () => {
      await this.clearQueue();
    });

    // 2. Global Service Worker Error Listeners
    if (typeof self !== 'undefined') {
      self.addEventListener('error', (event: ErrorEvent) => {
        this.captureWorkerException(event.error || new Error(event.message || 'Worker error'));
      });

      self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        this.captureWorkerException(event.reason || new Error('Worker Unhandled Rejection'));
      });
    }

    // 3. Attempt initial queue flush on wake
    await this.flushQueue();
  }

  public async handleIncomingRecord(record: TelemetryRecord): Promise<void> {
    if (!TelemetryKillSwitch.isEnabled()) return;
    await this.enqueueRecord(record);
    await this.flushQueue();
  }

  public async captureWorkerException(error: unknown): Promise<TelemetryRecord | null> {
    if (!TelemetryKillSwitch.isEnabled()) return null;

    const errObj = error instanceof Error ? error : new Error(String(error));
    const exceptionType = errObj.name || 'Error';
    const sanitizedMessage = UniversalSanitizer.sanitizeErrorMessage(
      errObj.message || 'Worker error'
    );
    const { normalizedStack, topFrame } = StackNormalizer.normalize(errObj.stack);
    const fingerprint = Fingerprinter.compute(this.clientInterface, exceptionType, topFrame);

    const record: TelemetryRecord = {
      serviceName: 'md-comments',
      serviceVersion: '1.2.3',
      clientInterface: this.clientInterface,
      timestamp: Date.now(),
      severity: 'ERROR',
      exception: {
        type: exceptionType,
        message: sanitizedMessage,
        stacktrace: normalizedStack,
        escaped: true,
      },
      fingerprint,
      breadcrumbs: [
        { timestamp: Date.now(), category: 'worker', message: 'Service worker runtime exception' },
      ],
      browserPlatform: this.clientInterface === 'safari-extension' ? 'Safari' : 'Chrome',
      osFamily: 'unknown',
    };

    await this.enqueueRecord(record);
    await this.flushQueue();
    return record;
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    await TelemetryKillSwitch.setEnabled(enabled);
    await browserStorage.set({ [SETTING_TELEMETRY_ENABLED_KEY]: enabled });
    if (!enabled) {
      await this.clearQueue();
    }
  }

  public async clearQueue(): Promise<void> {
    await browserStorage.remove(STORAGE_QUEUE_KEY);
  }

  public async getQueue(): Promise<TelemetryRecord[]> {
    const data = await browserStorage.get<{ [STORAGE_QUEUE_KEY]?: TelemetryRecord[] }>({
      [STORAGE_QUEUE_KEY]: [],
    });
    return data[STORAGE_QUEUE_KEY] || [];
  }

  private async enqueueRecord(record: TelemetryRecord): Promise<void> {
    const currentQueue = await this.getQueue();
    currentQueue.push(record);

    // Limit persistent queue to max 100 items (FIFO)
    while (currentQueue.length > MAX_QUEUE_SIZE) {
      currentQueue.shift();
    }

    await browserStorage.set({ [STORAGE_QUEUE_KEY]: currentQueue });
  }

  public async flushQueue(): Promise<void> {
    if (this.isFlushing || !TelemetryKillSwitch.isEnabled()) return;
    this.isFlushing = true;

    try {
      const queue = await this.getQueue();
      if (!queue.length) return;

      const payload = {
        resourceLogs: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: queue[0].serviceName } },
                { key: 'service.version', value: { stringValue: queue[0].serviceVersion } },
                { key: 'client.interface', value: { stringValue: queue[0].clientInterface } },
              ],
            },
            scopeLogs: [
              {
                scope: { name: 'md-comments-telemetry' },
                logRecords: queue.map((rec) => ({
                  timeUnixNano: String(rec.timestamp * 1000000),
                  severityText: rec.severity,
                  body: { stringValue: rec.exception.message },
                  attributes: [
                    { key: 'exception.type', value: { stringValue: rec.exception.type } },
                    { key: 'exception.message', value: { stringValue: rec.exception.message } },
                    {
                      key: 'exception.stacktrace',
                      value: { stringValue: rec.exception.stacktrace || '' },
                    },
                    {
                      key: 'exception.escaped',
                      value: { boolValue: rec.exception.escaped ?? true },
                    },
                    { key: 'error.fingerprint', value: { stringValue: rec.fingerprint } },
                    { key: 'breadcrumbs', value: { stringValue: JSON.stringify(rec.breadcrumbs) } },
                    {
                      key: 'browser.platform',
                      value: { stringValue: rec.browserPlatform || 'unknown' },
                    },
                    { key: 'os.family', value: { stringValue: rec.osFamily || 'unknown' } },
                  ],
                })),
              },
            ],
          },
        ],
      };

      // Dispatch to Cloudflare proxy without any credentials (INV-ZERO-CLIENT-SECRETS)
      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await this.clearQueue();
      }
    } catch {
      // Offline or network error: records remain in persistent storage for next retry
    } finally {
      this.isFlushing = false;
    }
  }
}

export const backgroundTelemetry = BackgroundTelemetryManager.getInstance();
