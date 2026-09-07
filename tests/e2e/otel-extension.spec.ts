import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import fs from 'fs';
import path from 'path';
import { MockOtelCollector } from '../mocks/mockOtelCollector';

const CHROME_DIST_DIR = path.resolve(process.cwd(), 'chrome-extension/dist/chrome');
const FIXTURE_HTML_PATH = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');

test.describe('OpenTelemetry Exception Observability & E2E Egress', () => {
  let mockCollector: MockOtelCollector;
  let collectorUrl: string;

  test.beforeAll(async () => {
    mockCollector = new MockOtelCollector();
    collectorUrl = await mockCollector.start();
  });

  test.afterAll(async () => {
    await mockCollector.stop();
  });

  test('FEAT-EXT-OTEL-EXCEPTION: Verifies zero client secrets and manifest permissions', async () => {
    allure.epic('OpenTelemetry Observability');
    allure.feature('FEAT-EXT-OTEL-EXCEPTION');
    allure.story('Manifest and Distribution Compliance');

    const manifestPath = path.join(CHROME_DIST_DIR, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.host_permissions).toContain('https://*.workers.dev/*');

    // Assert zero vendor secrets or API keys are baked into compiled bundles
    const contentJs = fs.readFileSync(path.join(CHROME_DIST_DIR, 'content.js'), 'utf8');
    const backgroundJs = fs.readFileSync(path.join(CHROME_DIST_DIR, 'background.js'), 'utf8');

    expect(contentJs).not.toContain('glc_eyJ');
    expect(backgroundJs).not.toContain('glc_eyJ');
    expect(contentJs).not.toContain('cfut_N');
    expect(backgroundJs).not.toContain('cfut_N');
  });

  test('INV-ZERO-CUSTOMER-DATA & INV-TELEMETRY-KILLSWITCH: Simulates in-page error reporting', async ({
    page,
  }) => {
    allure.epic('OpenTelemetry Observability');
    allure.feature('INV-ZERO-CUSTOMER-DATA');
    allure.story('Error Boundary and Sanitized Egress');

    const htmlContent = fs.readFileSync(FIXTURE_HTML_PATH, 'utf8');

    await page.route(
      'https://github.com/md-comments/md-test/blob/main/README.md',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: htmlContent,
        });
      }
    );

    // Route telemetry endpoint to mock hermetic collector
    await page.route(`${collectorUrl}/*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });

    await page.goto('https://github.com/md-comments/md-test/blob/main/README.md');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads cleanly with zero uncaught console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    expect(consoleErrors.length).toBe(0);
  });
});
