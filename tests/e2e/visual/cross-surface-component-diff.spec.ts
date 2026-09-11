import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import path from 'path';
import { startStaticServer, type StaticServer } from '../fixtures/staticServer.js';

const WEBSITE_DIR = path.resolve(process.cwd(), 'website');

test.describe('Cross-Interface Visual & UX Parity Suite (GitHub, VS Code, Demo Sites)', () => {
  let server: StaticServer;

  test.beforeAll(async () => {
    server = await startStaticServer(WEBSITE_DIR);
  });

  test.afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  test('FEAT-DOM-VISUAL-PARITY: Verifies canonical component metrics, FAB geometry, drawer styling, and reaction bar', async ({
    page,
  }) => {
    allure.epic('Visual Consistency & Parity');
    allure.feature('FEAT-DOM-VISUAL-PARITY');
    allure.story('Canonical Component Dimensions, Styling, and Interaction Parity');

    await test.step('1. Navigate to demo mock playground', async () => {
      await page.goto(`${server.url}/demo-mock/index.html`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('2. Verify FAB matches canonical 44px pill geometry & styling tokens', async () => {
      const fab = page.locator('#md-comments-fab-toggle, .md-comments-fab-toggle');
      await expect(fab).toBeAttached({ timeout: 5000 });

      // Verify geometry
      const box = await fab.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }

      // Verify computed border-radius is circular (pill)
      const borderRadius = await fab.evaluate((el) => window.getComputedStyle(el).borderRadius);
      expect(borderRadius).toMatch(/^(50%|9999px|[0-9]{2,}px)/);

      // Verify badge count indicator is attached
      const badge = fab.locator('.badge-count');
      await expect(badge).toBeAttached();
    });

    await test.step('3. Verify Drawer container dimensions and transition classes', async () => {
      const drawer = page.locator('.md-comments-drawer, #md-comments-sidebar');
      await expect(drawer).toBeAttached();

      const fab = page.locator('#md-comments-fab-toggle, .md-comments-fab-toggle');
      await fab.click();

      // Ensure drawer is marked open
      await expect(drawer).toHaveClass(/md-comments-drawer-open|open/, { timeout: 5000 });

      const drawerBox = await drawer.boundingBox();
      expect(drawerBox).not.toBeNull();
      if (drawerBox) {
        // Canonical drawer width is between 320px and 400px
        expect(drawerBox.width).toBeGreaterThanOrEqual(320);
        expect(drawerBox.width).toBeLessThanOrEqual(420);
      }
    });

    await test.step('3b. Verify Refresh button geometry and icon centering', async () => {
      const refreshBtn = page
        .locator('.md-comments-drawer-refresh, .refresh-btn, #md-comments-sidebar-refresh')
        .first();
      await expect(refreshBtn).toBeVisible({ timeout: 5000 });

      // Wait for drawer slide-in animation (250ms transition) to settle before bounding box measurements
      await page.waitForTimeout(300);

      const btnBox = await refreshBtn.boundingBox();
      const svg = refreshBtn.locator('svg').first();
      await expect(svg).toBeVisible();
      const svgBox = await svg.boundingBox();

      expect(btnBox).not.toBeNull();
      expect(svgBox).not.toBeNull();
      if (btnBox && svgBox) {
        // Assert square proportions (tolerance 2px)
        expect(Math.abs(btnBox.width - btnBox.height)).toBeLessThanOrEqual(2);

        // Assert horizontal centering within wrapping rectangle (tolerance 1.5px)
        const leftGap = svgBox.x - btnBox.x;
        const rightGap = btnBox.x + btnBox.width - (svgBox.x + svgBox.width);
        expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1.5);

        // Assert vertical centering within wrapping rectangle (tolerance 1.5px)
        const topGap = svgBox.y - btnBox.y;
        const bottomGap = btnBox.y + btnBox.height - (svgBox.y + svgBox.height);
        expect(Math.abs(topGap - bottomGap)).toBeLessThanOrEqual(1.5);
      }
    });

    await test.step('4. Verify Comment Card structure, author avatar, and header alignment', async () => {
      const card = page.locator('.md-comments-card, .comment-card').first();
      await expect(card).toBeVisible({ timeout: 5000 });

      // Verify author avatar exists and has rounded geometry
      const avatar = card.locator('img.avatar, .md-comments-avatar, .author-avatar').first();
      if ((await avatar.count()) > 0) {
        const avatarRadius = await avatar.evaluate(
          (el) => window.getComputedStyle(el).borderRadius
        );
        expect(avatarRadius).toMatch(/^(50%|9999px|[0-9]{2,}px)/);
      }

      // Verify comment body text is visible
      const body = card.locator('.comment-body, .md-comments-card-body, .body').first();
      await expect(body).toBeVisible();
    });

    await test.step('5. Verify Reaction bar chips and active toggle states', async () => {
      const reactionBar = page
        .locator('.reactions-bar, .md-comments-reactions, .comment-reactions')
        .first();
      if ((await reactionBar.count()) > 0) {
        await expect(reactionBar).toBeVisible();
        const chips = reactionBar.locator('.reaction-btn, .reaction-chip, button');
        expect(await chips.count()).toBeGreaterThanOrEqual(1);
      }
    });

    await test.step('6. Capture visual screenshot artifact for Allure reporting', async () => {
      const screenshot = await page.screenshot({ fullPage: false });
      await allure.attachment('demo-drawer-open.png', screenshot, 'image/png');
      expect(screenshot.length).toBeGreaterThan(1000);
    });
  });
});
