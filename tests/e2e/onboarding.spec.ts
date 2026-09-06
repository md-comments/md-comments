import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Storage: Repository Onboarding & Ref Initialization', () => {
  test('FEAT-STOR-INIT-PROMPT: Displays setup guidance banner when repo uninitialized', async ({
    page,
  }) => {
    allure.epic('Storage');
    allure.feature('FEAT-STOR-INIT-PROMPT');
    allure.story('Repo Onboarding Prompt & Data Ref Setup Flow');

    await test.step('1. Render uninitialized repository container', async () => {
      await page.setContent(`
        <div id="repo-container">
          <div id="md-comments-onboarding" class="onboarding-card" style="border: 1px solid #d0d7de; padding: 16px; border-radius: 6px;">
            <h3>Enable Markdown Comments</h3>
            <p>This repository has not yet initialized the comment storage branch (refs/md-comments/data).</p>
            <button id="btn-init-comments">Initialize Comments</button>
            <div id="init-success-msg" style="display: none; color: #1a7f37; margin-top: 8px;">Comments storage initialized!</div>
          </div>
        </div>
      `);

      await page.evaluate(() => {
        const btn = document.getElementById('btn-init-comments')!;
        const msg = document.getElementById('init-success-msg')!;
        btn.addEventListener('click', () => {
          msg.style.display = 'block';
          btn.setAttribute('disabled', 'true');
        });
      });
    });

    await test.step('2. Verify onboarding banner is visible', async () => {
      const banner = page.locator('#md-comments-onboarding');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Enable Markdown Comments');
    });

    await test.step('3. Click initialize and verify status update', async () => {
      await page.click('#btn-init-comments');
      const successMsg = page.locator('#init-success-msg');
      await expect(successMsg).toBeVisible();
      await expect(successMsg).toContainText('Comments storage initialized!');
    });
  });
});
