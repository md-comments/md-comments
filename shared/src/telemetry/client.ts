/**
 * Universal OpenTelemetry Client for Markdown Comments
 * Enforces Zero-Customer-Data, Zero-PII, and Kill-Switch invariants across all client interfaces.
 */

import {
  Breadcrumb,
  ClientInterface,
  LogLevel,
  TelemetryClientOptions,
  TelemetryRecord,
  TelemetryTransport,
} from './otelTypes.js';
import { UniversalSanitizer } from './sanitizer.js';
import { StackNormalizer } from './stackNormalizer.js';
import { Fingerprinter } from './fingerprinter.js';
import { TelemetryKillSwitch } from './killswitch.js';

export class HttpTelemetryTransport implements TelemetryTransport {
  private endpointUrl: string;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl.replace(/\/$/, '');
  }

  public async send(records: TelemetryRecord[]): Promise<boolean> {
    if (!records.length || !this.endpointUrl) return true;

    // Zero Client Secrets (INV-ZERO-CLIENT-SECRETS): standard POST to proxy
    const targetUrl = this.endpointUrl.endsWith('/v1/logs')
      ? this.endpointUrl
      : `${this.endpointUrl}/v1/logs`;

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceLogs: [
            {
              resource: {
                attributes: [
                  { key: 'service.name', value: { stringValue: records[0].serviceName } },
                  { key: 'service.version', value: { stringValue: records[0].serviceVersion } },
                  { key: 'client.interface', value: { stringValue: records[0].clientInterface } },
                ],
              },
              scopeLogs: [
                {
                  scope: { name: 'md-comments-telemetry' },
                  logRecords: records.map((rec) => ({
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
                      {
                        key: 'breadcrumbs',
                        value: { stringValue: JSON.stringify(rec.breadcrumbs) },
                      },
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
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  public async flush(): Promise<void> {
    // Immediate flush for HTTP transport
  }
}

export class OtelTelemetryClient {
  private serviceName: string;
  private serviceVersion: string;
  private clientInterface: ClientInterface;
  private transport: TelemetryTransport;
  private browserPlatform?: string;
  private osFamily?: string;
  private breadcrumbs: Breadcrumb[] = [];
  private queue: TelemetryRecord[] = [];
  private maxBreadcrumbs: number = 10;
  private isFlushing: boolean = false;

  constructor(options: TelemetryClientOptions) {
    this.serviceName = options.serviceName || 'md-comments';
    this.serviceVersion = options.serviceVersion;
    this.clientInterface = options.clientInterface;
    this.browserPlatform = options.browserPlatform;
    this.osFamily = options.osFamily;

    this.transport =
      options.transport ||
      new HttpTelemetryTransport(
        options.endpointUrl || 'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs'
      );

    if (options.enabledByDefault === false) {
      TelemetryKillSwitch.setEnabled(false);
    }

    TelemetryKillSwitch.onPurge(() => {
      this.clearAll();
    });
  }

  /**
   * Records a user interaction breadcrumb (INV-ZERO-CUSTOMER-DATA: no user text or document code).
   */
  public recordBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, string | number | boolean>
  ): void {
    if (!TelemetryKillSwitch.isEnabled()) return;

    const sanitizedMessage = UniversalSanitizer.sanitizeString(message);
    const sanitizedData: Record<string, string | number | boolean> = {};

    if (data) {
      for (const [k, v] of Object.entries(data)) {
        sanitizedData[UniversalSanitizer.sanitizeString(k)] =
          typeof v === 'string' ? UniversalSanitizer.sanitizeString(v) : v;
      }
    }

    this.breadcrumbs.push({
      timestamp: Date.now(),
      category: UniversalSanitizer.sanitizeString(category),
      message: sanitizedMessage,
      data: sanitizedData,
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Captures, sanitizes, normalizes, and queues an unhandled or handled exception.
   */
  public async captureException(
    error: unknown,
    options?: { severity?: LogLevel; escaped?: boolean }
  ): Promise<TelemetryRecord | null> {
    if (!TelemetryKillSwitch.isEnabled()) return null;

    const errObj = error instanceof Error ? error : new Error(String(error));
    const exceptionType = errObj.name || 'Error';
    const sanitizedMessage = UniversalSanitizer.sanitizeErrorMessage(
      errObj.message || 'Unknown error'
    );
    const { normalizedStack, topFrame } = StackNormalizer.normalize(errObj.stack);
    const fingerprint = Fingerprinter.compute(this.clientInterface, exceptionType, topFrame);

    const record: TelemetryRecord = {
      serviceName: this.serviceName,
      serviceVersion: this.serviceVersion,
      clientInterface: this.clientInterface,
      timestamp: Date.now(),
      severity: options?.severity || 'ERROR',
      exception: {
        type: exceptionType,
        message: sanitizedMessage,
        stacktrace: normalizedStack,
        escaped: options?.escaped ?? true,
      },
      fingerprint,
      breadcrumbs: [...this.breadcrumbs],
      browserPlatform: this.browserPlatform,
      osFamily: this.osFamily,
    };

    this.queue.push(record);
    await this.flush();
    return record;
  }

  /**
   * Flushes queued telemetry records via the configured transport.
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || !this.queue.length || !TelemetryKillSwitch.isEnabled()) return;
    this.isFlushing = true;

    try {
      const recordsToSend = [...this.queue];
      const success = await this.transport.send(recordsToSend);
      if (success) {
        this.queue = this.queue.filter((r) => !recordsToSend.includes(r));
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Instantly wipes all breadcrumbs and queued records.
   */
  public clearAll(): void {
    this.breadcrumbs = [];
    this.queue = [];
  }

  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
