import { ideTelemetry } from './telemetry/ideTelemetry';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let outputChannel: { appendLine: (value: string) => void; dispose?: () => unknown } | undefined;
let customLogLevel: LogLevel | undefined;

export function setLogLevel(level: LogLevel | undefined): void {
  customLogLevel = level;
}

export function getLogLevel(): LogLevel {
  if (customLogLevel) {
    return customLogLevel;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscode = require('vscode');
    const configLevel = vscode.workspace?.getConfiguration?.('mdComments')?.get?.('logLevel');
    if (configLevel && configLevel in LOG_LEVEL_SEVERITY) {
      return configLevel as LogLevel;
    }
  } catch {
    // Outside VS Code or during test run
  }

  // Check environment variables
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVEL_SEVERITY) {
    return envLevel as LogLevel;
  }

  // If built or running in release mode or release branch, default is 'error'
  if (
    process.env.RELEASE_BUILD === 'true' ||
    process.env.RELEASE_BUILD === '1' ||
    process.env.NODE_ENV === 'production'
  ) {
    return 'error';
  }

  // Check git branch if in local development
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (branch.startsWith('release/')) {
      return 'error';
    }
  } catch {
    // Ignore git failure
  }

  return 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const current = getLogLevel();
  return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[current];
}

export function initializeLogger(context: {
  subscriptions: Array<{ dispose?: () => unknown }>;
}): void {
  try {
    ideTelemetry.init();
    // Dynamic import to support unit testing environment where vscode module is not available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscode = require('vscode');
    outputChannel = vscode.window.createOutputChannel('Markdown Comments');
    if (outputChannel) {
      context.subscriptions.push(outputChannel);
    }
  } catch {
    // Ignore when run outside VS Code (e.g., in vitest)
  }
}

export function logDebug(message: string, ...args: unknown[]): void {
  if (!shouldLog('debug')) {
    return;
  }
  const timestamp = new Date().toISOString();
  const formattedArgs = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');

  const line = `[${timestamp}] [DEBUG] ${message} ${formattedArgs}`.trim();
  console.log(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }
}

export function logInfo(message: string, ...args: unknown[]): void {
  if (!shouldLog('info')) {
    return;
  }
  const timestamp = new Date().toISOString();
  const formattedArgs = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');

  const line = `[${timestamp}] [INFO] ${message} ${formattedArgs}`.trim();
  console.info(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }
}

export function logError(message: string, error?: unknown): void {
  if (!shouldLog('error')) {
    return;
  }
  const timestamp = new Date().toISOString();
  const errText = error instanceof Error ? error.stack || error.message : String(error || '');
  const line = `[${timestamp}] [ERROR] ${message} ${errText}`.trim();
  console.error(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }

  // Relay sanitized error to OpenTelemetry proxy (INV-ZERO-CLIENT-SECRETS)
  ideTelemetry.captureException(error || new Error(message)).catch(() => {
    // Ignore telemetry send errors
  });
}
