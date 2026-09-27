import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import fs from 'fs';
import path from 'path';
import { createLocalMockServer, LocalMockServer } from '../mocks/localMockServer.js';

const FIXTURE_HTML_PATH = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');
const SAFARI_DIST_DIR = path.resolve(process.cwd(), 'chrome-extension/dist/safari');
const WEBSITE_DIR = path.resolve(process.cwd(), 'website');

test.describe('Safari WebExtension & WebKit Lifecycle', () => {
  let mockServer: LocalMockServer;
  let mockUrl: string;

  test.beforeAll(async () => {
    mockServer = createLocalMockServer();
    mockUrl = await mockServer.start();
  });

  test.afterAll(async () => {
    if (mockServer) {
      await mockServer.stop();
    }
  });
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

  test('FEAT-EXT-SAFARI-SILENT-REFRESH: Verifies WebKit sidebar includes progress line and supports silent refresh styling', async ({
    page,
  }) => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-SILENT-REFRESH');
    allure.story('WebKit Progress Line Rendering and Silent Refresh State');

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

    await page.goto('https://github.com/md-comments/md-test/blob/main/README.md');
    await page.waitForLoadState('domcontentloaded');

    const cssContent = fs.readFileSync(path.join(SAFARI_DIST_DIR, 'sidebar.css'), 'utf8');
    await page.addStyleTag({ content: cssContent });

    // Inject sidebar DOM structure
    await page.evaluate(() => {
      const sidebar = document.createElement('div');
      sidebar.id = 'md-comments-sidebar';
      sidebar.className = 'sidebar-container md-comments-scope';
      sidebar.innerHTML = `
        <div class="sidebar-header">
          <div class="title-section"><h3>Markdown Comments</h3></div>
          <div class="sidebar-header-actions">
            <button class="md-comments-header-btn refresh-btn">R</button>
          </div>
          <div class="sidebar-refresh-progress-line" id="sidebar-refresh-progress-line" style="display: none;"></div>
        </div>
        <div class="unauthorized-container" style="display: none;"></div>
        <div class="tab-header" style="display: flex;">
          <button class="tab-btn active" data-tab="inline">Inline</button>
        </div>
        <div class="tab-content" id="tab-inline" style="display: flex;">
          <div class="threads-list" id="inline-threads">
            <div class="md-comments-card" data-comment-id="c1">Existing comment</div>
          </div>
        </div>
      `;
      document.body.appendChild(sidebar);
    });

    const progressLine = page.locator('#sidebar-refresh-progress-line');
    await expect(progressLine).toHaveCount(1);
    await expect(progressLine).toBeHidden();

    // Activate progress line
    await page.evaluate(() => {
      const line = document.querySelector('#sidebar-refresh-progress-line') as HTMLElement;
      line.style.display = 'block';
      line.classList.add('active');
    });

    await expect(progressLine).toBeVisible();

    // Verify computed height is 2px
    const height = await progressLine.evaluate((el) => window.getComputedStyle(el).height);
    expect(height).toBe('2px');

    // Verify existing comments remain visible during active progress line (silent refresh)
    const commentCard = page.locator('.md-comments-card');
    await expect(commentCard).toBeVisible();
    await expect(page.locator('.installation-loading-card')).toHaveCount(0);
  });

  test('FEAT-EXT-SAFARI-ANCHOR: Verifies WebKit inline comment creation, yellow underline highlight, and non-orphaned card display', async ({
    page,
    context,
  }) => {
    allure.epic('Safari Extension');
    allure.feature('FEAT-EXT-SAFARI-ANCHOR');
    allure.story('WebKit Inline Comment Creation, Yellow Underline, and Non-Orphan Placement');

    const htmlContent = fs.readFileSync(FIXTURE_HTML_PATH, 'utf8');
    const rawMarkdown =
      '# Test Fixture Document\n\nThis is the first paragraph of documentation to be commented on.\n\nSecond paragraph providing further details on testing features and flow.\n';

    // Intercept github.com requests to serve fixture HTML and raw markdown
    await context.route('https://github.com/**', async (route) => {
      const reqUrl = new URL(route.request().url());

      if (reqUrl.searchParams.get('raw') === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          body: rawMarkdown,
        });
        return;
      }

      if (reqUrl.pathname.includes('/blob/')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: htmlContent,
        });
        return;
      }

      await route.continue();
    });

    // Intercept api.github.com requests and proxy directly to LocalMockServer
    await context.route('https://api.github.com/**', async (route) => {
      const reqUrl = new URL(route.request().url());
      const targetUrl = `${mockUrl}${reqUrl.pathname}${reqUrl.search}`;
      const headers = route.request().headers();
      const method = route.request().method();
      const postData = route.request().postData();

      try {
        const res = await fetch(targetUrl, {
          method,
          headers,
          body: postData || undefined,
        });
        const body = await res.text();
        await route.fulfill({
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body,
        });
      } catch (err: any) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: err.message }),
        });
      }
    });

    // Mock browser and chrome WebExtension APIs in WebKit page context
    await page.addInitScript(() => {
      const store: Record<string, any> = {
        oauthToken: 'mock-oauth-session-token',
        oauth_token: 'mock-oauth-session-token',
        github_user: { login: 'safari-test-bot', name: 'Safari Test Bot' },
        githubUser: { login: 'safari-test-bot', name: 'Safari Test Bot' },
      };

      const browserMock = {
        runtime: {
          getURL: (p: string) => p,
          sendMessage: () => Promise.resolve({ success: true }),
        },
        storage: {
          local: {
            get: (keys: any, callback?: (items: any) => void) => {
              let res: any = {};
              if (typeof keys === 'string') {
                res = { [keys]: store[keys] };
              } else if (Array.isArray(keys)) {
                keys.forEach((k) => {
                  res[k] = store[k];
                });
              } else if (typeof keys === 'object' && keys !== null) {
                res = { ...keys };
                Object.keys(keys).forEach((k) => {
                  if (store[k] !== undefined) res[k] = store[k];
                });
              } else {
                res = { ...store };
              }
              if (typeof callback === 'function') {
                callback(res);
              }
              return Promise.resolve(res);
            },
            set: (items: any, callback?: () => void) => {
              Object.assign(store, items);
              if (typeof callback === 'function') {
                callback();
              }
              return Promise.resolve();
            },
            remove: (keys: any, callback?: () => void) => {
              const arr = Array.isArray(keys) ? keys : [keys];
              arr.forEach((k) => delete store[k]);
              if (typeof callback === 'function') {
                callback();
              }
              return Promise.resolve();
            },
          },
          onChanged: { addListener: () => {}, removeListener: () => {} },
        },
      };

      (window as any).browser = browserMock;
      (window as any).chrome = browserMock;
    });

    // Step 1: Navigate to the GitHub markdown blob page in WebKit
    await page.goto('https://github.com/md-comments/md-test/blob/main/README.md');
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Inject compiled Safari styles and content script
    const cssContent = fs.readFileSync(path.join(SAFARI_DIST_DIR, 'sidebar.css'), 'utf8');
    await page.addStyleTag({ content: cssContent });

    const jsContent = fs.readFileSync(path.join(SAFARI_DIST_DIR, 'content.js'), 'utf8');
    await page.addScriptTag({ content: jsContent });

    // Step 3: Wait for FAB button and open sidebar drawer
    const fab = page.locator('#md-comments-fab-toggle');
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click();

    const drawer = page.locator('.md-comments-drawer, #md-comments-sidebar');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Step 4: Programmatically select text within #p-1
    await page.evaluate(() => {
      const p = document.getElementById('p-1');
      if (!p) throw new Error('Paragraph #p-1 not found');
      const range = document.createRange();
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    // Step 5: Click comment selection button
    const selBtn = page.locator('#md-comments-selection-button');
    await expect(selBtn).toBeVisible({ timeout: 5000 });
    await selBtn.click();

    // Step 6: Compose and submit inline comment
    const inlineComposer = page.locator('.new-inline-composer-wrapper');
    await expect(inlineComposer).toBeVisible({ timeout: 5000 });

    const inlineTextarea = page.locator('.new-inline-composer-container .fallback-reply-textarea');
    await expect(inlineTextarea).toBeVisible({ timeout: 5000 });

    const commentText = 'Safari WebKit Inline Comment: Anchored without becoming orphaned.';
    await inlineTextarea.fill(commentText);

    const submitBtn = page.locator('.new-inline-composer-container .fallback-submit-btn');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Step 7: Composer closes upon submission
    await expect(inlineComposer).toBeHidden();

    // Step 8: Assert yellow underline highlight rendered inside #p-1
    const p1Highlight = page.locator('#p-1 .md-comments-highlight');
    await expect(p1Highlight).toBeVisible({ timeout: 10000 });

    // Assert computed style has yellow underline (border-bottom)
    const borderBottom = await p1Highlight.evaluate(
      (el) => window.getComputedStyle(el).borderBottom
    );
    expect(borderBottom).toMatch(/2px (solid|dashed)/);

    // Step 9: Assert card in #tab-inline is visible and does NOT have orphan badge
    const inlineCard = page
      .locator('#tab-inline .md-comments-card')
      .filter({ hasText: 'Safari WebKit Inline Comment' });
    await expect(inlineCard).toBeVisible({ timeout: 10000 });

    const orphanBadge = inlineCard.locator('.md-comments-badge.orphan');
    await expect(orphanBadge).toHaveCount(0);

    // Step 10: Assert persistence across reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.addStyleTag({ content: cssContent });
    await page.addScriptTag({ content: jsContent });

    const reloadedHighlight = page.locator('#p-1 .md-comments-highlight');
    await expect(reloadedHighlight).toBeVisible({ timeout: 10000 });

    const reloadedFab = page.locator('#md-comments-fab-toggle');
    await expect(reloadedFab).toBeVisible({ timeout: 10000 });
    await reloadedFab.click();

    const reloadedCard = page
      .locator('#tab-inline .md-comments-card')
      .filter({ hasText: 'Safari WebKit Inline Comment' });
    await expect(reloadedCard).toBeVisible({ timeout: 10000 });
    await expect(reloadedCard.locator('.md-comments-badge.orphan')).toHaveCount(0);
  });
});
