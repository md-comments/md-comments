import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UniversalSanitizer,
  StackNormalizer,
  Fingerprinter,
  TelemetryKillSwitch,
  OtelTelemetryClient,
  TelemetryTransport,
} from '../shared/telemetry';

describe('Shared Telemetry Core (sharedTelemetry)', () => {
  beforeEach(async () => {
    await TelemetryKillSwitch.setEnabled(true);
  });

  describe('UniversalSanitizer (INV-ZERO-CUSTOMER-DATA, INV-ZERO-PII-LEAK)', () => {
    it('should redact GitHub and cloud authentication tokens', () => {
      const text =
        'Failed with token ghp_ABC1234567890abcdefghijklmnopqrstuvwxyz and glc_eyJhbGciOiJIUzI1NiJ9';
      const sanitized = UniversalSanitizer.sanitizeString(text);
      expect(sanitized).not.toContain('ghp_ABC1234567890abcdefghijklmnopqrstuvwxyz');
      expect(sanitized).not.toContain('glc_eyJhbGciOiJIUzI1NiJ9');
      expect(sanitized).toContain('[REDACTED_SECRET]');
    });

    it('should redact Bearer authorization headers and JWTs', () => {
      const text =
        'Authorization: Bearer secret-token-xyz and eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const sanitized = UniversalSanitizer.sanitizeString(text);
      expect(sanitized).not.toContain('secret-token-xyz');
      expect(sanitized).not.toContain('eyJzdWIi');
      expect(sanitized).toContain('[REDACTED_SECRET]');
    });

    it('should redact email addresses', () => {
      const text = 'Author email is developer@example.com for review';
      const sanitized = UniversalSanitizer.sanitizeString(text);
      expect(sanitized).not.toContain('developer@example.com');
      expect(sanitized).toContain('[REDACTED_EMAIL]');
    });

    it('should redact local user home directories across macOS, Linux, and Windows', () => {
      const macPath = '/Users/johndoe/projects/md-comments/src/index.ts';
      const linuxPath = '/home/ubuntu/repo/dist/main.js';
      const winPath = 'C:\\Users\\Administrator\\AppData\\Local';

      expect(UniversalSanitizer.sanitizeString(macPath)).toBe(
        '~/projects/md-comments/src/index.ts'
      );
      expect(UniversalSanitizer.sanitizeString(linuxPath)).toBe('~/repo/dist/main.js');
      expect(UniversalSanitizer.sanitizeString(winPath)).toBe('~\\AppData\\Local');
    });

    it('should strip sensitive query parameters from URLs', () => {
      const url = 'https://github.com/login/oauth?code=xyz123&state=abc';
      const sanitized = UniversalSanitizer.sanitizeString(url);
      expect(sanitized).not.toContain('code=xyz123');
      expect(sanitized).toBe('https://github.com/login/oauth?query=[REDACTED]');
    });

    it('should truncate lengthy strings to prevent leaking user markdown bodies', () => {
      const longText = 'a'.repeat(600);
      const sanitized = UniversalSanitizer.sanitizeString(longText);
      expect(sanitized.length).toBeLessThan(550);
      expect(sanitized).toContain('[TRUNCATED]');
    });

    it('should strip multiline customer inputs from exception messages', () => {
      const multilineMsg = 'Unexpected error occurred\n# Markdown Title\nUser comment body';
      const cleaned = UniversalSanitizer.sanitizeErrorMessage(multilineMsg);
      expect(cleaned).toBe('Unexpected error occurred');
      expect(cleaned).not.toContain('User comment body');
    });
  });

  describe('StackNormalizer (Cross-Engine V8 & JavaScriptCore)', () => {
    it('should normalize Chromium V8 stack traces and extract clean relative frames', () => {
      const v8Stack = `Error: Cannot read properties of null
    at renderSidebar (chrome-extension://mjlhdjonjfcedkbpajkfeidfebefhkpp/dist/content.js:124:18)
    at HTMLDocument.onTurboLoad (https://github.com/dist/content.js:450:12)`;

      const { normalizedStack, topFrame } = StackNormalizer.normalize(v8Stack);
      expect(normalizedStack).toContain('renderSidebar (dist/content.js:124)');
      expect(topFrame).toBe('renderSidebar (dist/content.js:124)');
    });

    it('should normalize Safari JavaScriptCore stack traces to matching frames', () => {
      const jscStack = `renderSidebar@safari-web-extension://12345/dist/content.js:124:18
onTurboLoad@https://github.com/dist/content.js:450:12`;

      const { normalizedStack, topFrame } = StackNormalizer.normalize(jscStack);
      expect(normalizedStack).toContain('renderSidebar (dist/content.js:124)');
      expect(topFrame).toBe('renderSidebar (dist/content.js:124)');
    });

    it('should produce identical topFrames for identical code across Chrome and Safari', () => {
      const v8 = 'at executeAction (https://github.com/dist/background.js:55:10)';
      const jsc = 'executeAction@safari-extension://xyz/dist/background.js:55:10';

      const v8Result = StackNormalizer.normalize(v8);
      const jscResult = StackNormalizer.normalize(jsc);

      expect(v8Result.topFrame).toBe(jscResult.topFrame);
      expect(v8Result.topFrame).toBe('executeAction (dist/background.js:55)');
    });
  });

  describe('Fingerprinter (Deterministic Error Fingerprints)', () => {
    it('should generate identical deterministic fingerprints for same error tuple', () => {
      const fp1 = Fingerprinter.compute(
        'chrome-extension',
        'TypeError',
        'renderSidebar (dist/content.js:124)'
      );
      const fp2 = Fingerprinter.compute(
        'chrome-extension',
        'TypeError',
        'renderSidebar (dist/content.js:124)'
      );
      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(16);
    });

    it('should produce different fingerprints for different interfaces or lines', () => {
      const fpChrome = Fingerprinter.compute(
        'chrome-extension',
        'TypeError',
        'init (dist/content.js:10)'
      );
      const fpSafari = Fingerprinter.compute(
        'safari-extension',
        'TypeError',
        'init (dist/content.js:10)'
      );
      const fpOtherLine = Fingerprinter.compute(
        'chrome-extension',
        'TypeError',
        'init (dist/content.js:20)'
      );

      expect(fpChrome).not.toBe(fpSafari);
      expect(fpChrome).not.toBe(fpOtherLine);
    });
  });

  describe('TelemetryKillSwitch & OtelTelemetryClient (INV-TELEMETRY-KILLSWITCH)', () => {
    it('should limit breadcrumbs to maximum of 10 items (FIFO)', () => {
      const client = new OtelTelemetryClient({
        serviceVersion: '1.3.0',
        clientInterface: 'chrome-extension',
      });

      for (let i = 0; i < 15; i++) {
        client.recordBreadcrumb('ui', `Action ${i}`);
      }

      const breadcrumbs = client.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(10);
      expect(breadcrumbs[0].message).toBe('Action 5');
      expect(breadcrumbs[9].message).toBe('Action 14');
    });

    it('should capture and queue sanitized exception records', async () => {
      const mockTransport: TelemetryTransport = {
        send: vi.fn().mockResolvedValue(true),
        flush: vi.fn().mockResolvedValue(undefined),
      };

      const client = new OtelTelemetryClient({
        serviceVersion: '1.3.0',
        clientInterface: 'chrome-extension',
        transport: mockTransport,
      });

      client.recordBreadcrumb('navigation', 'Navigated to PR page');
      const err = new TypeError('Cannot read property of null at ghp_secret');
      const record = await client.captureException(err);

      expect(record).not.toBeNull();
      expect(record?.exception.type).toBe('TypeError');
      expect(record?.exception.message).toContain('[REDACTED_SECRET]');
      expect(record?.breadcrumbs).toHaveLength(1);
      expect(mockTransport.send).toHaveBeenCalledTimes(1);
    });

    it('should immediately stop recording and purge queues when kill-switch is triggered', async () => {
      const mockTransport: TelemetryTransport = {
        send: vi.fn().mockResolvedValue(true),
        flush: vi.fn().mockResolvedValue(undefined),
      };

      const client = new OtelTelemetryClient({
        serviceVersion: '1.3.0',
        clientInterface: 'chrome-extension',
        transport: mockTransport,
      });

      client.recordBreadcrumb('ui', 'Click event');
      expect(client.getBreadcrumbs()).toHaveLength(1);

      // Disable telemetry via killswitch
      await TelemetryKillSwitch.setEnabled(false);

      // Queue and breadcrumbs should be immediately purged
      expect(client.getBreadcrumbs()).toHaveLength(0);
      expect(client.getQueueLength()).toBe(0);

      // Attempting to capture an exception while disabled should return null and make 0 network calls
      const record = await client.captureException(new Error('Test error'));
      expect(record).toBeNull();
      expect(mockTransport.send).not.toHaveBeenCalled();
    });
  });
});
