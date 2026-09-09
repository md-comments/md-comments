/**
 * Content Script Telemetry & Error Boundary Layer (Chrome & Safari MV3)
 * Captures unhandled exceptions, records user breadcrumbs, and securely funnels
 * diagnostic events to the background service worker via browserRuntime IPC.
 */

import { browserRuntime } from '../browserApi';
import { Breadcrumb, TelemetryRecord } from '../../../shared/src/telemetry/otelTypes';
import { UniversalSanitizer } from '../../../shared/src/telemetry/sanitizer';
import { StackNormalizer } from '../../../shared/src/telemetry/stackNormalizer';
import { Fingerprinter } from '../../../shared/src/telemetry/fingerprinter';
import { TelemetryKillSwitch } from '../../../shared/src/telemetry/killswitch';

class ContentTelemetryManager {
  private static instance: ContentTelemetryManager;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number = 10;
  private initialized: boolean = false;
  private clientInterface: 'chrome-extension' | 'safari-extension';

  private constructor() {
    const isSafari =
      typeof globalThis !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((globalThis as any).browser?.runtime && !(globalThis as any).chrome?.runtime?.id);
    this.clientInterface = isSafari ? 'safari-extension' : 'chrome-extension';
  }

  public static getInstance(): ContentTelemetryManager {
    if (!ContentTelemetryManager.instance) {
      ContentTelemetryManager.instance = new ContentTelemetryManager();
    }
    return ContentTelemetryManager.instance;
  }

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Global Window Error Listener
    window.addEventListener('error', (event: ErrorEvent) => {
      // Prevent benign extension invalidation from polluting the console
      if (this.isBenignExtensionError(event.error || event.message)) {
        return;
      }

      this.captureException(event.error || new Error(event.message || 'Window error'), {
        escaped: true,
      });
    });

    // 2. Global Unhandled Promise Rejection Listener
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      if (this.isBenignExtensionError(event.reason)) {
        return;
      }

      this.captureException(event.reason || new Error('Unhandled Promise Rejection'), {
        escaped: true,
      });
    });

    // 3. GitHub Turbo / PJAX Navigation Breadcrumbs
    document.addEventListener('turbo:load', () => {
      this.recordBreadcrumb('navigation', 'GitHub Turbo soft navigation loaded');
    });

    document.addEventListener('pjax:end', () => {
      this.recordBreadcrumb('navigation', 'GitHub PJAX navigation completed');
    });

    this.recordBreadcrumb('lifecycle', 'Content script initialized on page');
  }

  public recordBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, string | number | boolean>
  ): void {
    if (!TelemetryKillSwitch.isEnabled()) return;

    this.breadcrumbs.push({
      timestamp: Date.now(),
      category: UniversalSanitizer.sanitizeString(category),
      message: UniversalSanitizer.sanitizeString(message),
      data,
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  public async captureException(
    error: unknown,
    options?: { escaped?: boolean }
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
      serviceName: 'md-comments',
      serviceVersion: '1.3.1',
      clientInterface: this.clientInterface,
      timestamp: Date.now(),
      severity: 'ERROR',
      exception: {
        type: exceptionType,
        message: sanitizedMessage,
        stacktrace: normalizedStack,
        escaped: options?.escaped ?? true,
      },
      fingerprint,
      breadcrumbs: [...this.breadcrumbs],
      browserPlatform: this.clientInterface === 'safari-extension' ? 'Safari' : 'Chrome',
      osFamily: this.detectOsFamily(),
    };

    // Forward to background service worker via IPC (INV-ZERO-CLIENT-SECRETS)
    try {
      await browserRuntime.sendMessage({
        type: 'OTEL_LOG_RECORD',
        payload: record,
      });
    } catch {
      // If service worker is temporarily sleeping or context invalidated, silently ignore
    }

    return record;
  }

  private isBenignExtensionError(error: unknown): boolean {
    const msg = String(error instanceof Error ? error.message : error || '');
    return (
      msg.includes('Extension context invalidated') ||
      msg.includes('Could not establish connection') ||
      msg.includes('Receiving end does not exist')
    );
  }

  private detectOsFamily(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('win')) return 'Windows';
    if (ua.includes('linux')) return 'Linux';
    return 'unknown';
  }
}

export const contentTelemetry = ContentTelemetryManager.getInstance();
