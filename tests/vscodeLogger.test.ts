import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logDebug,
  logInfo,
  logError,
  setLogLevel,
  getLogLevel,
  initializeLogger,
} from '../vscode-extension/src/logger';
import { ideTelemetry } from '../vscode-extension/src/telemetry/ideTelemetry';

describe('VS Code Logger (vscode-extension/src/logger)', () => {
  const originalEnv = { ...process.env };
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let telemetryCaptureSpy: any;

  beforeEach(() => {
    setLogLevel(undefined);
    delete process.env.LOG_LEVEL;
    delete process.env.RELEASE_BUILD;
    delete process.env.NODE_ENV;

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    telemetryCaptureSpy = vi
      .spyOn(ideTelemetry, 'captureException')
      .mockImplementation(async () => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setLogLevel(undefined);
    vi.restoreAllMocks();
  });

  it('defaults to error log level when RELEASE_BUILD=true', () => {
    process.env.RELEASE_BUILD = 'true';
    expect(getLogLevel()).toBe('error');
  });

  it('defaults to debug log level in normal development (or error on release branch)', () => {
    expect(['debug', 'error']).toContain(getLogLevel());
  });

  it('respects LOG_LEVEL environment variable', () => {
    process.env.LOG_LEVEL = 'warn';
    expect(getLogLevel()).toBe('warn');
  });

  it('allows programmatic setLogLevel override', () => {
    setLogLevel('silent');
    expect(getLogLevel()).toBe('silent');
    setLogLevel('info');
    expect(getLogLevel()).toBe('info');
  });

  it('outputs all logs when level is debug', () => {
    setLogLevel('debug');

    logDebug('debug test message', { key: 'value' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][0]).toContain('[DEBUG] debug test message {"key":"value"}');

    logInfo('info test message');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO] info test message');

    logError('error test message', new Error('sample failure'));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR] error test message');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('sample failure');
    expect(telemetryCaptureSpy).toHaveBeenCalledTimes(1);
  });

  it('suppresses debug and info logs when level is error (release branch default)', () => {
    setLogLevel('error');

    logDebug('debug should be suppressed');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    logInfo('info should be suppressed');
    expect(consoleInfoSpy).not.toHaveBeenCalled();

    logError('critical error occurred', new Error('boom'));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR] critical error occurred');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('boom');
    expect(telemetryCaptureSpy).toHaveBeenCalledTimes(1);
  });

  it('suppresses debug logs but allows info and error when level is info', () => {
    setLogLevel('info');

    logDebug('debug should be suppressed');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    logInfo('info should pass');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

    logError('error should pass');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('suppresses all logs including errors when level is silent', () => {
    setLogLevel('silent');

    logDebug('debug');
    logInfo('info');
    logError('error');

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(telemetryCaptureSpy).not.toHaveBeenCalled();
  });

  it('handles initializeLogger gracefully outside VS Code host', () => {
    const subscriptions: Array<{ dispose?: () => unknown }> = [];
    expect(() => initializeLogger({ subscriptions })).not.toThrow();
  });
});
