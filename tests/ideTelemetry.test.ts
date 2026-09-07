import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdeTelemetryManager } from '../vscode-extension/src/telemetry/ideTelemetry';
import { TelemetryKillSwitch } from '../shared/telemetry';

describe('Desktop AI IDE Telemetry Adapter (ideTelemetry)', () => {
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

  it('should detect host IDE and capture exceptions with Zero Client Secrets', async () => {
    const ideManager = IdeTelemetryManager.getInstance();
    ideManager.init('https://mock-proxy.workers.dev/v1/logs');

    ideManager.recordBreadcrumb('command', 'Executed mdComments.openCommentPreview');
    const err = new Error('Failed to resolve git ref in workspace at /Users/developer/secret-repo');
    await ideManager.captureException(err);

    expect(globalFetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = globalFetchMock.mock.calls[0];
    expect(url).toBe('https://mock-proxy.workers.dev/v1/logs');

    const parsed = JSON.parse(init.body);
    const logRecord = parsed.resourceLogs[0].scopeLogs[0].logRecords[0];

    // Check allowlist attributes
    expect(
      logRecord.attributes.find((a: any) => a.key === 'exception.type').value.stringValue
    ).toBe('Error');

    // Check PII / Path scrubbing
    const scrubbedMsg = logRecord.attributes.find((a: any) => a.key === 'exception.message').value
      .stringValue;
    expect(scrubbedMsg).not.toContain('/Users/developer');
    expect(scrubbedMsg).toContain('~/secret-repo');

    // Check Zero Client Secrets: no Authorization header sent by client
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('should respect kill-switch when disabled in IDE settings', async () => {
    const ideManager = IdeTelemetryManager.getInstance();
    ideManager.init('https://mock-proxy.workers.dev/v1/logs');

    await TelemetryKillSwitch.setEnabled(false);

    await ideManager.captureException(new Error('This should be ignored'));
    expect(globalFetchMock).not.toHaveBeenCalled();
  });
});
