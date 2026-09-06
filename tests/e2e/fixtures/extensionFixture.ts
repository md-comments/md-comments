import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { resetTestRepository } from '../../../scripts/test-repo-cleanup.js';

export const pathToExtension = path.resolve(process.cwd(), 'chrome-extension/dist');

import { createCoverageHelper, type CoverageHelper } from './coverageHelper.js';

export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  testPage: Page;
  coverageHelper: CoverageHelper;
}

export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern
  coverageHelper: async ({}, use) => {
    const helper = createCoverageHelper('./coverage/cdp');
    await use(helper);
    await helper.stopAndCollect();
  },

  context: async ({ coverageHelper }, use) => {
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

    // Attach CDP coverage to service worker if possible
    await coverageHelper.startServiceWorkerCoverage(context);

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

    const token =
      process.env.TEST_GITHUB_TOKEN || process.env.GITHUB_TOKEN || 'mock-oauth-session-token';
    const login = process.env.TEST_GITHUB_USER || 'md-comments-test-bot';
    const user = {
      login,
      name: 'MD Comments Test Bot',
      avatar_url: `https://avatars.githubusercontent.com/${login}?s=48`,
    };

    if (backgroundWorker) {
      await backgroundWorker.evaluate(
        async ({ token, user }) => {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({
              oauthToken: token,
              oauth_token: token,
              github_user: user,
              githubUser: user,
            });
          }
        },
        { token, user }
      );
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
    const login = process.env.TEST_GITHUB_USER || 'md-comments-test-bot';

    // Inject GitHub user-login meta tag into DOM to simulate real logged-in GitHub session
    await page.addInitScript((botLogin) => {
      const injectMeta = () => {
        let meta = document.querySelector('meta[name="user-login"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'user-login');
          (document.head || document.documentElement).appendChild(meta);
        }
        meta.setAttribute('content', botLogin);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectMeta);
      } else {
        injectMeta();
      }
    }, login);

    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
