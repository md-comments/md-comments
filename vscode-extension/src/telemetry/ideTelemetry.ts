/**
 * Desktop AI IDE Telemetry Adapter (VS Code, Cursor, Google Antigravity)
 * Hooks into VS Code Extension Host, respects telemetryLevel, and relays
 * sanitized exceptions to the Cloudflare proxy with Zero Client Secrets.
 */

import { OtelTelemetryClient } from '../../../shared/src/telemetry/client';
import { TelemetryKillSwitch } from '../../../shared/src/telemetry/killswitch';

export class IdeTelemetryManager {
  private static instance: IdeTelemetryManager;
  private client: OtelTelemetryClient | null = null;
  private ideName: string = 'VS Code';
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): IdeTelemetryManager {
    if (!IdeTelemetryManager.instance) {
      IdeTelemetryManager.instance = new IdeTelemetryManager();
    }
    return IdeTelemetryManager.instance;
  }

  public init(endpointUrl?: string): void {
    if (this.initialized) return;
    this.initialized = true;

    // Detect IDE environment safely
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const vscode = require('vscode');
      const appName = vscode.env?.appName || 'VS Code';
      if (appName.toLowerCase().includes('cursor')) {
        this.ideName = 'Cursor';
      } else if (appName.toLowerCase().includes('antigravity')) {
        this.ideName = 'Antigravity';
      } else {
        this.ideName = 'VS Code';
      }

      // Check native telemetry permission
      const isEnabled = vscode.env?.isTelemetryEnabled ?? true;
      TelemetryKillSwitch.setEnabled(isEnabled);

      // Listen to telemetry configuration changes if supported
      if (vscode.env?.onDidChangeTelemetryEnabled) {
        vscode.env.onDidChangeTelemetryEnabled((enabled: boolean) => {
          TelemetryKillSwitch.setEnabled(enabled);
        });
      }
    } catch {
      // Running outside VS Code (e.g. in vitest)
      this.ideName = 'VS Code (Test)';
    }

    this.client = new OtelTelemetryClient({
      serviceName: 'md-comments',
      serviceVersion: '1.4.1',
      clientInterface: 'vscode-extension',
      browserPlatform: this.ideName,
      osFamily:
        process.platform === 'darwin'
          ? 'macOS'
          : process.platform === 'win32'
            ? 'Windows'
            : 'Linux',
      endpointUrl:
        endpointUrl || 'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs',
    });
  }

  public recordBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, string | number | boolean>
  ): void {
    this.client?.recordBreadcrumb(category, message, data);
  }

  public async captureException(error: unknown, options?: { escaped?: boolean }): Promise<void> {
    await this.client?.captureException(error, options);
  }

  public getIdeName(): string {
    return this.ideName;
  }
}

export const ideTelemetry = IdeTelemetryManager.getInstance();
