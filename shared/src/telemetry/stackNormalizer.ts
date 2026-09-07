/**
 * Cross-Engine Stack Trace Normalizer
 * Normalizes V8 (Chromium, Node.js), JavaScriptCore (Safari), and SpiderMonkey (Firefox)
 * into a uniform representation for cross-browser deduplication and deterministic fingerprinting.
 */

import { UniversalSanitizer } from './sanitizer.js';

export interface NormalizedFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export class StackNormalizer {
  /**
   * Normalizes a raw stack trace into a scrubbed, path-relative representation.
   */
  public static normalize(rawStack?: string): { normalizedStack: string; topFrame: string } {
    if (!rawStack || typeof rawStack !== 'string') {
      return { normalizedStack: '', topFrame: 'unknown' };
    }

    const lines = rawStack.split('\n');
    const normalizedLines: string[] = [];
    let topFrame = 'unknown';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const frame = this.parseFrame(trimmed);
      if (frame) {
        const frameStr = `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`;
        normalizedLines.push(frameStr);
        if (
          topFrame === 'unknown' &&
          !frame.fileName.includes('node_modules') &&
          !frame.fileName.includes('internal/')
        ) {
          topFrame = frameStr;
        }
      } else {
        // Fallback: sanitize the raw line
        normalizedLines.push(UniversalSanitizer.sanitizeString(trimmed));
      }
    }

    return {
      normalizedStack: normalizedLines.slice(0, 10).join('\n'),
      topFrame: topFrame !== 'unknown' ? topFrame : normalizedLines[0] || 'unknown',
    };
  }

  private static parseFrame(line: string): NormalizedFrame | null {
    // 1. Chrome / Node V8 format: "at functionName (path/file.js:12:34)" or "at path/file.js:12:34"
    const v8Match = line.match(/^at\s+(?:(.+?)\s+\((.+?):(\d+):(\d+)\)|(.+?):(\d+):(\d+))$/);
    if (v8Match) {
      const functionName = v8Match[1] || '<anonymous>';
      const fullPath = v8Match[2] || v8Match[5] || '';
      const lineNumber = parseInt(v8Match[3] || v8Match[6] || '0', 10);
      const columnNumber = parseInt(v8Match[4] || v8Match[7] || '0', 10);

      return {
        functionName,
        fileName: this.cleanFileName(fullPath),
        lineNumber,
        columnNumber,
      };
    }

    // 2. Safari / WebKit JavaScriptCore format: "functionName@path/file.js:12:34" or "path/file.js:12:34"
    const atIdx = line.indexOf('@');
    const locationPart = atIdx !== -1 ? line.slice(atIdx + 1) : line;
    const functionName = atIdx !== -1 ? line.slice(0, atIdx) || '<anonymous>' : '<anonymous>';

    const lastColon = locationPart.lastIndexOf(':');
    const secondLastColon = lastColon !== -1 ? locationPart.lastIndexOf(':', lastColon - 1) : -1;

    if (lastColon !== -1 && secondLastColon !== -1) {
      const fullPath = locationPart.slice(0, secondLastColon);
      const lineNumber = parseInt(locationPart.slice(secondLastColon + 1, lastColon), 10);
      const columnNumber = parseInt(locationPart.slice(lastColon + 1), 10);

      if (!isNaN(lineNumber) && !isNaN(columnNumber) && fullPath) {
        return {
          functionName,
          fileName: this.cleanFileName(fullPath),
          lineNumber,
          columnNumber,
        };
      }
    }

    return null;
  }

  private static cleanFileName(fullPath: string): string {
    // Strip URL protocols (chrome-extension://, https://, file://)
    let cleaned = fullPath.replace(/^[a-zA-Z0-9+-]+:\/\/[^/]+\//, '');
    // Strip query strings
    cleaned = cleaned.replace(/\?.*$/, '');
    // Strip absolute directories, leaving last 2 path segments (e.g. dist/content.js)
    const segments = cleaned.split(/[/\\]/);
    return segments.slice(-2).join('/');
  }
}
