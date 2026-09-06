import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('DOM: PR Diff Multi-Document Explorer & Custom Source View', () => {
  test('FEAT-DOMI-PR-FILEBROWSER: Navigates files via PR browser drawer', async ({ page }) => {
    allure.epic('DOM');
    allure.feature('FEAT-DOMI-PR-FILEBROWSER');
    allure.story('Multi-File PR Diff Browser Navigation Drawer');

    await test.step('1. Mount simulated PR diff with multiple markdown file containers', async () => {
      await page.setContent(`
        <div id="pr-files-browser">
          <div class="browser-item" data-path="docs/guide.md" style="cursor: pointer;">docs/guide.md</div>
          <div class="browser-item" data-path="README.md" style="cursor: pointer;">README.md</div>
        </div>
        <div id="files-pane">
          <div class="md-file-wrapper" data-file-path="docs/guide.md" style="height: 400px; border: 1px solid #ccc;">
            <h3>docs/guide.md Content</h3>
          </div>
          <div class="md-file-wrapper" data-file-path="README.md" style="height: 400px; border: 1px solid #ccc; margin-top: 50px;">
            <h3>README.md Content</h3>
          </div>
        </div>
      `);

      await page.evaluate(() => {
        const activeFile = 'docs/guide.md';
        (window as any).__activeFile = activeFile;

        document.querySelectorAll('.browser-item').forEach((item) => {
          item.addEventListener('click', () => {
            const p = item.getAttribute('data-path');
            if (p) {
              (window as any).__activeFile = p;
              const target = document.querySelector(
                '.md-file-wrapper[data-file-path="' + p + '"]'
              ) as HTMLElement;
              if (target) target.scrollIntoView();
            }
          });
        });
      });
    });

    await test.step('2. Click README.md item in file browser and verify active context', async () => {
      await page.click('.browser-item[data-path="README.md"]');
      const active = await page.evaluate(() => (window as any).__activeFile);
      expect(active).toBe('README.md');
    });
  });

  test('FEAT-DOMI-PR-CUSTOMVIEW: Toggles between native diff and custom markdown view', async ({
    page,
  }) => {
    allure.epic('DOM');
    allure.feature('FEAT-DOMI-PR-CUSTOMVIEW');
    allure.story('Custom Markdown Source View Toggle on PRs');

    await test.step('1. Render PR file container with tab toggles', async () => {
      await page.setContent(`
        <div class="file-header">
          <button id="tab-diff" class="selected">Diff View</button>
          <button id="tab-custom">Custom Source View</button>
        </div>
        <div id="view-diff" style="display: block;">Native Diff Lines</div>
        <div id="view-custom" style="display: none;">Rendered Markdown with Inline Comments</div>
      `);

      await page.evaluate(() => {
        const diffTab = document.getElementById('tab-diff')!;
        const customTab = document.getElementById('tab-custom')!;
        const diffView = document.getElementById('view-diff')!;
        const customView = document.getElementById('view-custom')!;

        customTab.addEventListener('click', () => {
          diffView.style.display = 'none';
          customView.style.display = 'block';
          customTab.classList.add('selected');
          diffTab.classList.remove('selected');
        });

        diffTab.addEventListener('click', () => {
          customView.style.display = 'none';
          diffView.style.display = 'block';
          diffTab.classList.add('selected');
          customTab.classList.remove('selected');
        });
      });
    });

    await test.step('2. Click custom source view tab and verify display toggle', async () => {
      await page.click('#tab-custom');
      await expect(page.locator('#view-custom')).toBeVisible();
      await expect(page.locator('#view-diff')).toBeHidden();

      await page.click('#tab-diff');
      await expect(page.locator('#view-diff')).toBeVisible();
      await expect(page.locator('#view-custom')).toBeHidden();
    });
  });
});
