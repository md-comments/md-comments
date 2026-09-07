import { ideTelemetry } from './telemetry/ideTelemetry';

let outputChannel: { appendLine: (value: string) => void; dispose?: () => unknown } | undefined;

export function initializeLogger(context: {
  subscriptions: Array<{ dispose?: () => unknown }>;
}): void {
  try {
    ideTelemetry.init();
    // Dynamic import to support unit testing environment where vscode module is not available
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
