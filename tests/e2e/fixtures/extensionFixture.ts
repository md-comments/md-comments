import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { resetTestRepository } from '../../../scripts/test-repo-cleanup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pathToExtension = path.resolve(__dirname, '../../../chrome-extension/dist');

export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  testPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  context: async (_unused, use) => {
    // 1. Clean test repo before starting
    await resetTestRepository();

    // 2. Prepare isolated temporary profile directory
    const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chrome-profile-'));

    // 3. Launch Chromium in modern headless mode with extension loaded
    const context = await chromium.launchPersistentContext(tempUserDataDir, {
      headless: true,
      args: [
        '--headless=new',
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-gpu',
      ],
    });

    // 4. Inject OAuth session credentials into chrome.storage.local
    let [backgroundWorker] = context.serviceWorkers();
    if (!backgroundWorker) {
      try {
        backgroundWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
      } catch {
        console.warn(
          '[extensionFixture] Service worker wait timed out, continuing without worker mock injection'
        );
      }
    }

    if (backgroundWorker) {
      await backgroundWorker.evaluate(async () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({
            oauth_token: 'mock-oauth-session-token',
            github_user: {
              login: 'test-runner-bot',
              name: 'Test Runner Bot',
              avatar_url: 'https://github.com/ghost.png',
            },
          });
        }
      });
    }

    await use(context);

    // 5. Teardown: Uninstall extension, purge profile, reset refs
    try {
      await context.close();
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
      console.log('[Teardown] Purged temporary browser profile and uninstalled extension.');
    } catch (err) {
      console.warn('[Teardown] Cleanup warning:', err);
    }
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      try {
        background = await context.waitForEvent('serviceworker', { timeout: 10000 });
      } catch {
        // ignore
      }
    }
    const extensionId = background ? background.url().split('/')[2] : '';
    await use(extensionId);
  },

  testPage: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
