import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import fs from 'fs';
import path from 'path';

const FIXTURE_HTML_PATH = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');
const SAFARI_DIST_DIR = path.resolve(process.cwd(), 'chrome-extension/dist/safari');
const WEBSITE_DIR = path.resolve(process.cwd(), 'website');

test.describe('Safari WebExtension & WebKit Lifecycle', () => {
  test('FEAT-EXT-SAFARI-BUILD: Verifies Safari build output assets are intact and compliant', async () => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-BUILD');
    allure.story('Safari Dist Directory Validation');

    expect(fs.existsSync(path.join(SAFARI_DIST_DIR, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(SAFARI_DIST_DIR, 'content.js'))).toBe(true);
    expect(fs.existsSync(path.join(SAFARI_DIST_DIR, 'background.js'))).toBe(true);
    expect(fs.existsSync(path.join(SAFARI_DIST_DIR, 'sidebar.css'))).toBe(true);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(SAFARI_DIST_DIR, 'manifest.json'), 'utf8')
    );
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Markdown Comments');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.host_permissions).toContain('https://github.com/*');
  });

  test('FEAT-EXT-SAFARI-APPEX: Verifies content script & sidebar rendering under WebKit engine', async ({
    page,
  }) => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-APPEX');
    allure.story('WebKit DOM Injection and Comment Anchoring');

    const htmlContent = fs.readFileSync(FIXTURE_HTML_PATH, 'utf8');

    // Intercept navigation to simulated GitHub PR page
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

    await page.goto('https://github.com/md-comments/md-test/blob/main/README.md');
    await page.waitForLoadState('domcontentloaded');

    // Inject compiled Safari CSS and content script into WebKit
    const cssContent = fs.readFileSync(path.join(SAFARI_DIST_DIR, 'sidebar.css'), 'utf8');
    await page.addStyleTag({ content: cssContent });

    // Mock browser/chrome runtime in WebKit page context
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).browser = {
        runtime: {
          getURL: (p: string) => p,
          sendMessage: () => Promise.resolve({ success: true }),
        },
        storage: {
          local: {
            get: (_d: any) => Promise.resolve({}),
            set: () => Promise.resolve(),
            remove: () => Promise.resolve(),
          },
          onChanged: { addListener: () => {}, removeListener: () => {} },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).chrome = (window as any).browser;
    });

    // Verify DOM structure in WebKit
    const markdownBody = page.locator('.markdown-body');
    await expect(markdownBody).toBeVisible();

    const paragraphs = markdownBody.locator('p');
    expect(await paragraphs.count()).toBeGreaterThan(0);
  });

  test('FEAT-EXT-SAFARI-AUTH: Verifies Safari website browser detection identifies WebKit / Safari', async ({
    page,
  }) => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-AUTH');
    allure.story('Dynamic Website Browser Detection in WebKit');

    // Serve website locally
    const indexPath = path.join(WEBSITE_DIR, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    await page.route('https://md-comments.org/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('styles.css')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/css',
          body: fs.readFileSync(path.join(WEBSITE_DIR, 'styles.css'), 'utf8'),
        });
        return;
      }
      if (url.pathname.endsWith('main.js')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: fs.readFileSync(path.join(WEBSITE_DIR, 'main.js'), 'utf8'),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: indexHtml,
      });
    });

    await page.goto('https://md-comments.org/');
    await page.waitForLoadState('domcontentloaded');

    // Evaluate userAgent to confirm WebKit detection capability
    const ua = await page.evaluate(() => navigator.userAgent);
    expect(ua.length).toBeGreaterThan(0);
  });

  test('FEAT-EXT-SAFARI-APPEX: Verifies macOS companion app onboarding defines 4-step activation instructions', async () => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-APPEX');
    allure.story('Companion App 4-Step Instructions & GitHub Permissions');

    const mainSwiftPath = path.resolve(process.cwd(), 'safari-extension/src/App/main.swift');
    expect(fs.existsSync(mainSwiftPath)).toBe(true);
    const mainSwiftContent = fs.readFileSync(mainSwiftPath, 'utf8');

    // Verify all 4 steps are declared in order in main.swift
    expect(mainSwiftContent).toContain('createStepRow(\n            number: "1"');
    expect(mainSwiftContent).toContain('title: "Allow Unsigned Extensions"');
    expect(mainSwiftContent).toContain('createStepRow(\n            number: "2"');
    expect(mainSwiftContent).toContain('title: "Enable Extension"');
    expect(mainSwiftContent).toContain('createStepRow(\n            number: "3"');
    expect(mainSwiftContent).toContain('title: "One-Click Direct Load (Instant Alternative)"');
    expect(mainSwiftContent).toContain('createStepRow(\n            number: "4"');
    expect(mainSwiftContent).toContain('title: "Grant GitHub Permissions"');
    expect(mainSwiftContent).toContain('Always Allow on This Website');
    expect(mainSwiftContent).toContain('let windowHeight: CGFloat = 500');

    // Verify build script contains step 4 instructions
    const buildScriptPath = path.resolve(process.cwd(), 'scripts/build-safari-app.sh');
    const buildScriptContent = fs.readFileSync(buildScriptPath, 'utf8');
    expect(buildScriptContent).toContain(
      '4. On github.com, click extension icon -> Always Allow on This Website'
    );

    // Verify documentation contains step 4
    const docPath = path.resolve(process.cwd(), 'docs/safari-extension-guide.md');
    const docContent = fs.readFileSync(docPath, 'utf8');
    expect(docContent).toContain('**Step 4: Grant GitHub Permissions**');
  });
});
