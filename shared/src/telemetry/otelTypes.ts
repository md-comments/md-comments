/**
 * OpenTelemetry types and diagnostic schemas for Markdown Comments.
 * Enforces strict allowlist properties: zero customer data, zero PII.
 */

export type ClientInterface =
  | 'chrome-extension'
  | 'safari-extension'
  | 'vscode-extension'
  | 'obsidian-plugin'
  | 'starlight-plugin'
  | 'embed'
  | 'core';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: Record<string, string | number | boolean>;
}

export interface SanitizedException {
  type: string;
  message: string;
  stacktrace?: string;
  escaped?: boolean;
}

/**
 * Strict Technical Diagnostic Schema (INV-ZERO-CUSTOMER-DATA)
 */
export interface TelemetryRecord {
  serviceName: string;
  serviceVersion: string;
  clientInterface: ClientInterface;
  timestamp: number;
  severity: LogLevel;
  exception: SanitizedException;
  fingerprint: string;
  breadcrumbs: Breadcrumb[];
  browserPlatform?: string;
  osFamily?: string;
}

export interface TelemetryTransport {
  send(records: TelemetryRecord[]): Promise<boolean>;
  flush(): Promise<void>;
  purge?(): Promise<void>;
}

export interface TelemetryClientOptions {
  serviceName?: string;
  serviceVersion: string;
  clientInterface: ClientInterface;
  transport?: TelemetryTransport;
  browserPlatform?: string;
  osFamily?: string;
  endpointUrl?: string;
  enabledByDefault?: boolean;
}
