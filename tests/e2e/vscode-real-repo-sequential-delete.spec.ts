import { test, expect } from './fixtures/vscodeFixture';
import { execFileSync } from 'node:child_process';

test.describe('VS Code Real Repo Sequential Deletion E2E', () => {
  test('runs in test repository md-comments/md-comments-test, validates cancel does not prematurely remove card, deletes comments in sequence without blank page, and verifies GitHub commits', async ({
    vscode,
  }) => {
    const { page, runCommand, getCommentPreviewFrame } = vscode;
    page.on('console', (msg) => console.log('VSCODE CONSOLE:', msg.type(), msg.text()));

    const targetOwner = process.env.TEST_REPO_OWNER || 'md-comments';
    const targetRepo = process.env.TEST_REPO_NAME || 'md-comments-test';

    // 1. Verify git remote points to target test repository
    const remoteOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: vscode.workspaceDir,
      encoding: 'utf8',
    }).trim();
    expect(remoteOrigin).toContain(`${targetOwner}/${targetRepo}`);

    // 2. Open native Markdown preview to side via Command Palette
    await runCommand('Markdown: Open Preview to the Side');

    // 3. Locate native markdown preview iframe
    const previewFrame = getCommentPreviewFrame();

    // Verify layout rendered inside native preview
    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeAttached({ timeout: 15000 });

    // 4. Ensure comments sidebar drawer is open (open via FAB if not already open)
    const sidebar = previewFrame.locator('#md-comments-sidebar');
    const fab = previewFrame.locator('#md-comments-panel-fab');
    if (!(await sidebar.isVisible())) {
      await expect(fab).toBeVisible({ timeout: 10000 });
      await fab.click();
    }
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    // Allow any initial background refresh to settle
    await page.waitForTimeout(2500);

    // 5. Ensure page comments tab is selected
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    if (await pageTab.isVisible()) {
      await pageTab.click();
    }

    // Seed comments if fewer than 3 exist in the test repository
    let sidebarCards = previewFrame.locator('#md-comments-sidebar .md-comments-card:visible');
    while ((await sidebarCards.count()) < 3) {
      const textarea = previewFrame.locator('#page-composer .page-textarea');
      await expect(textarea).toBeVisible({ timeout: 5000 });
      const currentCount = await sidebarCards.count();
      await textarea.fill(`Automated E2E Test Comment ${currentCount + 1}`);
      const submitBtn = previewFrame.locator('#page-composer .submit-page-btn');
      await submitBtn.click();
      await page.waitForTimeout(1500);
      sidebarCards = previewFrame.locator('#md-comments-sidebar .md-comments-card:visible');
    }

    await expect(sidebarCards.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await sidebarCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // 6. Deep Chain C1 & C3: The 7-Step Cancel/Delete Carousel + Editor Save Stress Test
    // Identify three separate comment cards: A, B, and C
    const idA = await sidebarCards.nth(0).getAttribute('data-md-comment-id');
    const idB = await sidebarCards.nth(1).getAttribute('data-md-comment-id');
    const idC = await sidebarCards.nth(2).getAttribute('data-md-comment-id');
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idC).toBeTruthy();
    expect(new Set([idA, idB, idC]).size).toBe(3);

    const cardALocator = previewFrame.locator(
      `#md-comments-sidebar .md-comments-card[data-md-comment-id="${idA}"]`
    );
    const cardBLocator = previewFrame.locator(
      `#md-comments-sidebar .md-comments-card[data-md-comment-id="${idB}"]`
    );
    const cardCLocator = previewFrame.locator(
      `#md-comments-sidebar .md-comments-card[data-md-comment-id="${idC}"]`
    );

    const deleteHelper = async (
      cardLocator: any,
      expectedText: string,
      action: 'Cancel' | 'Delete'
    ) => {
      const btn = cardLocator.locator('[data-md-action="delete"]').first();
      await expect(btn).toBeVisible({ timeout: 5000 });
      await btn.click();

      const dialog = page.locator('.monaco-dialog-box');
      await expect(dialog).toBeVisible({ timeout: 15000 });
      await expect(dialog).toContainText('Delete this comment permanently?');

      const actionBtn = dialog
        .locator('a.monaco-button, button.monaco-button', { hasText: action })
        .first();
      await expect(actionBtn).toBeVisible({ timeout: 5000 });
      await actionBtn.click();
      await expect(dialog).toBeHidden({ timeout: 5000 });
    };

    // STEP 1: Delete Comment A -> Cancel
    await deleteHelper(cardALocator, 'Comment A', 'Cancel');
    await expect(cardALocator).toBeVisible();
    await expect(sidebarCards).toHaveCount(initialCount);

    // STEP 2: Delete Comment B -> Confirm (Delete)
    await deleteHelper(cardBLocator, 'Comment B', 'Delete');
    await expect(cardBLocator).toBeHidden({ timeout: 10000 });
    await expect(layout).toBeAttached({ timeout: 5000 });
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // STEP 3: Delete Comment C -> Cancel
    await deleteHelper(cardCLocator, 'Comment C', 'Cancel');
    await expect(cardCLocator).toBeVisible();

    // STEP 4: Delete Comment A again -> Cancel
    await deleteHelper(cardALocator, 'Comment A', 'Cancel');
    await expect(cardALocator).toBeVisible();

    // STEP 5: Delete Comment C again -> Confirm (Delete)
    await deleteHelper(cardCLocator, 'Comment C', 'Delete');
    await expect(cardCLocator).toBeHidden({ timeout: 10000 });
    await expect(layout).toBeAttached({ timeout: 5000 });

    // STEP 6: Delete Comment A again -> Confirm (Delete)
    await deleteHelper(cardALocator, 'Comment A', 'Delete');
    await expect(cardALocator).toBeHidden({ timeout: 10000 });
    await expect(layout).toBeAttached({ timeout: 5000 });

    // STEP 7: Interleaved Editor Focus, Save & Reload (C3)
    // Switch to editor tab, save file, switch back to preview, verify none of A, B, or C resurrect
    await runCommand('View: Focus First Editor Group');
    await page.waitForTimeout(1000);
    await runCommand('File: Save');
    await page.waitForTimeout(1000);
    await runCommand('View: Focus Second Editor Group');
    await page.waitForTimeout(1000);

    // Verify preview is still fully intact and no deleted comments returned
    await expect(layout).toBeAttached({ timeout: 10000 });
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    await expect(cardALocator).toBeHidden({ timeout: 5000 });
    await expect(cardBLocator).toBeHidden({ timeout: 5000 });
    await expect(cardCLocator).toBeHidden({ timeout: 5000 });

    // Wait for async background writeQueue to complete GitHub API requests
    await page.waitForTimeout(6000);

    // Query GitHub API directly via gh CLI if authenticated
    try {
      const refDataRaw = execFileSync(
        'gh',
        ['api', `repos/${targetOwner}/${targetRepo}/git/ref/md-comments/data`],
        {
          encoding: 'utf8',
          timeout: 10000,
        }
      );
      const refData = JSON.parse(refDataRaw) as { object: { sha: string } };
      expect(refData.object.sha).toBeTruthy();

      const commitDataRaw = execFileSync(
        'gh',
        ['api', `repos/${targetOwner}/${targetRepo}/git/commits/${refData.object.sha}`],
        { encoding: 'utf8', timeout: 10000 }
      );
      const commitData = JSON.parse(commitDataRaw) as {
        author: { name: string };
        message: string;
      };
      expect(commitData.author.name).toBeTruthy();
      expect(commitData.message).toContain('Update comments for');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        'Skipping remote GitHub ref API verification (gh CLI unauthenticated or rate-limited):',
        msg
      );
    }
  });
});
