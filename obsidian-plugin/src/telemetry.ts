import { OtelTelemetryClient, TelemetryKillSwitch } from '../../shared/telemetry';

export class ObsidianTelemetryAdapter {
  private static instance: ObsidianTelemetryAdapter;
  private client: OtelTelemetryClient;

  private constructor(endpointUrl?: string) {
    this.client = new OtelTelemetryClient({
      serviceName: 'md-comments',
      serviceVersion: '1.4.1',
      clientInterface: 'obsidian-plugin',
      browserPlatform: 'Obsidian Desktop',
      osFamily:
        typeof process !== 'undefined' && process.platform === 'darwin'
          ? 'macOS'
          : typeof process !== 'undefined' && process.platform === 'win32'
            ? 'Windows'
            : 'Linux',
      endpointUrl:
        endpointUrl || 'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs',
    });
  }

  public static getInstance(endpointUrl?: string): ObsidianTelemetryAdapter {
    if (!ObsidianTelemetryAdapter.instance) {
      ObsidianTelemetryAdapter.instance = new ObsidianTelemetryAdapter(endpointUrl);
    }
    return ObsidianTelemetryAdapter.instance;
  }

  public async captureException(
    error: unknown,
    options?: { severity?: 'ERROR' | 'WARN' | 'FATAL'; escaped?: boolean }
  ): Promise<void> {
    await this.client.captureException(error, options);
  }

  public recordBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, string | number | boolean>
  ): void {
    this.client.recordBreadcrumb(category, message, data);
  }

  public setEnabled(enabled: boolean): void {
    TelemetryKillSwitch.setEnabled(enabled);
  }
}
