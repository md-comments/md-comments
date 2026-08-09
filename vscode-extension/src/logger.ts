let outputChannel: any;

export function initializeLogger(context: any): void {
  try {
    // Dynamic import to support unit testing environment where vscode module is not available
    const vscode = require('vscode');
    outputChannel = vscode.window.createOutputChannel('Markdown Comments');
    context.subscriptions.push(outputChannel);
  } catch {
    // Ignore when run outside VS Code (e.g., in vitest)
  }
}

export function logDebug(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  const line = `[${timestamp}] [DEBUG] ${message} ${formattedArgs}`.trim();
  console.log(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }
}

export function logInfo(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  const line = `[${timestamp}] [INFO] ${message} ${formattedArgs}`.trim();
  console.info(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }
}

export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  const errText = error instanceof Error ? error.stack || error.message : String(error || '');
  const line = `[${timestamp}] [ERROR] ${message} ${errText}`.trim();
  console.error(line);
  if (outputChannel) {
    outputChannel.appendLine(line);
  }
}
