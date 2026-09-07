import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObsidianTelemetryAdapter } from '../obsidian-plugin/src/telemetry';
import { TelemetryKillSwitch } from '../shared/telemetry';

describe('Obsidian Plugin Telemetry Adapter (obsidianTelemetry)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globalFetchMock: any;

  beforeEach(async () => {
    await TelemetryKillSwitch.setEnabled(true);
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

  it('should capture exceptions with Zero Client Secrets routing to Cloudflare Worker proxy', async () => {
    const adapter = ObsidianTelemetryAdapter.getInstance(
      'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs'
    );

    adapter.recordBreadcrumb('vault', 'Opened Markdown file in active leaf');
    const err = new Error(
      'Vault sync failed for note in /Users/obsidian-user/Documents/secret-vault'
    );
    await adapter.captureException(err);

    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = globalFetchMock.mock.calls[0];
    expect(url).toBe('https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs');

    const parsed = JSON.parse(init.body);
    const resource = parsed.resourceLogs[0].resource;
    // Verify client interface is obsidian-plugin
    const clientInterfaceAttr = resource.attributes.find((a: any) => a.key === 'client.interface');
    expect(clientInterfaceAttr.value.stringValue).toBe('obsidian-plugin');

    const logRecord = parsed.resourceLogs[0].scopeLogs[0].logRecords[0];

    // Check PII / Path scrubbing
    const scrubbedMsg = logRecord.attributes.find((a: any) => a.key === 'exception.message').value
      .stringValue;
    expect(scrubbedMsg).not.toContain('/Users/obsidian-user');

    // Check Zero Client Secrets: no Authorization header sent by client
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('should respect kill-switch when disabled in Obsidian settings', async () => {
    const adapter = ObsidianTelemetryAdapter.getInstance(
      'https://md-comments-telemetry-proxy.md-comments.workers.dev/v1/logs'
    );

    adapter.setEnabled(false);

    await adapter.captureException(new Error('This should be ignored when disabled'));
    expect(globalFetchMock).not.toHaveBeenCalled();
  });
});
