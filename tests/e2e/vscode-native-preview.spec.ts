import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Native Markdown Preview Integration E2E', () => {
  test('injects markdown preview scripts, renders floating FAB, and toggles comments drawer in native preview', async ({
    vscode,
  }) => {
    const { runCommand, getCommentPreviewFrame } = vscode;

    // 1. Open native Markdown preview to side via Command Palette
    await runCommand('Markdown: Open Preview to the Side');

    // 2. Locate native markdown preview iframe
    const previewFrame = getCommentPreviewFrame();

    // Verify document rendered inside native preview
    const docTitle = previewFrame.locator('h1');
    await expect(docTitle).toBeVisible({ timeout: 15000 });
    await expect(docTitle).toHaveText('Guide to Documentation');

    // 3. Verify floating action button (FAB) contributed by markdown.previewScripts
    const fab = previewFrame.locator('#md-comments-panel-fab');
    await expect(fab).toBeVisible({ timeout: 10000 });
    const fabSvg = fab.locator('svg.md-comments-fab-icon');
    await expect(fabSvg).toHaveAttribute('viewBox', '0 0 512 512');

    // 4. Verify comments sidebar layout container
    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeVisible({ timeout: 5000 });

    // 5. Click FAB to open the sidebar drawer
    await fab.dispatchEvent('click');

    // 6. Verify layout gets md-comments-sidebar-open class, fab aria-expanded is true, and FAB is hidden
    await expect(layout).toHaveClass(/md-comments-sidebar-open/, { timeout: 5000 });
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(fab).toBeHidden();

    // 7. Verify comments sidebar drawer is visible
    const sidebar = previewFrame.locator('#md-comments-sidebar');
    await expect(sidebar).toBeVisible();

    // 8. Verify save hint notice in native preview (pointing to custom Comment Preview Panel)
    const saveHint = previewFrame.locator('.md-comments-save-hint');
    await expect(saveHint).toBeVisible();
    await expect(saveHint).toContainText('Saving comments');

    // 9. Close sidebar and verify FAB becomes visible again
    const closeBtn = previewFrame.locator('#md-comments-sidebar-close');
    await closeBtn.dispatchEvent('click');
    await expect(layout).not.toHaveClass(/md-comments-sidebar-open/);
    await expect(fab).toBeVisible();
  });

  test('verifies native preview action trigger anchor, card pointer cursor, and non-stuck reply submission', async ({
    vscode,
  }) => {
    const { runCommand, getCommentPreviewFrame } = vscode;

    vscode.page.on('console', (msg) => console.log('VSCODE PAGE CONSOLE:', msg.type(), msg.text()));
    await runCommand('Markdown: Open Preview to the Side');
    const previewFrame = getCommentPreviewFrame();

    // 1. Verify action trigger anchor element is present in the DOM
    const actionTrigger = previewFrame.locator('#md-comments-action-trigger');
    await expect(actionTrigger).toHaveCount(1);
    await expect(actionTrigger).toHaveAttribute('rel', /noreferrer/);

    // 2. Open sidebar drawer via FAB
    const fab = previewFrame.locator('#md-comments-panel-fab');
    await fab.click();

    // 3. Verify side padding and margins on threads list
    const threadsList = previewFrame.locator('.md-comments-threads-list').first();
    await expect(threadsList).toBeVisible({ timeout: 5000 });
    const padding = await threadsList.evaluate((el) => window.getComputedStyle(el).padding);
    expect(padding).toBe('12px 14px 16px');

    // 4. Verify pointer cursor on any existing card
    const card = previewFrame.locator('.md-comments-card').first();
    if ((await card.count()) > 0) {
      const cursor = await card.evaluate((el) => window.getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');

      // 5. Test reply button click
      const replyBtn = card.locator('[data-md-action="reply"]').first();
      if ((await replyBtn.count()) > 0) {
        await replyBtn.click();
        const replyWrapper = card.locator('.reply-composer-wrapper');
        await expect(replyWrapper).toBeVisible({ timeout: 3000 });
      }
    }

    // 5. Submit page comment in native preview drawer and verify preview does NOT crash / blank
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await pageTab.dispatchEvent('click');
    const pageComposer = previewFrame.locator('#page-composer');
    await expect(pageComposer).toBeVisible();
    const textarea = pageComposer.locator('.page-textarea');
    const commentText = 'Testing comment submission in native preview';
    await textarea.fill(commentText);
    const submitBtn = pageComposer.locator('.submit-page-btn');
    await submitBtn.dispatchEvent('click');

    // Verify optimistic card was inserted immediately
    const optimisticCard = previewFrame.locator('.md-comments-card', { hasText: commentText });
    await expect(optimisticCard).toBeVisible({ timeout: 3000 });

    // Verify action trigger anchor receives the uri with encoded payload
    await expect(actionTrigger).toHaveAttribute('href', /action=addPage/);

    await vscode.page.waitForTimeout(4000);

    // Verify preview re-renders with the persisted card
    const cardWithComment = previewFrame.locator(
      '.md-comments-card:not(.md-comments-card-optimistic)',
      { hasText: commentText }
    );
    await expect(cardWithComment).toBeVisible({ timeout: 10000 });

    // Test clicking reaction picker or emoji button on the card
    const reactPickerBtn = cardWithComment.locator('[data-md-action="react-picker"]');
    await expect(reactPickerBtn).toBeVisible({ timeout: 5000 });
    await reactPickerBtn.click();
    const emojiPopover = previewFrame.locator('#md-comments-emoji-popover');
    await expect(emojiPopover).toBeVisible({ timeout: 3000 });
    const firstEmoji = emojiPopover.locator('.md-comments-emoji-btn').first();
    await firstEmoji.click();
    // Verify popover closes after reaction pick
    await expect(emojiPopover).toBeHidden({ timeout: 3000 });
    // Verify reaction chip is added optimistically and visible
    const reactionChip = cardWithComment.locator('.md-comments-reaction-chip').first();
    await expect(reactionChip).toBeVisible({ timeout: 5000 });

    // Test editing the comment and verifying immediate visual update
    const editBtn = cardWithComment.locator('.md-comments-edit-btn');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    const editInput = cardWithComment.locator('.md-comments-editor-input');
    await expect(editInput).toBeVisible({ timeout: 3000 });
    await editInput.fill('Edited comment text in native preview');
    const saveBtn = cardWithComment.locator(
      '.md-comments-panel-composer button[data-action="submit"]'
    );
    await saveBtn.click();
    const editedCard = previewFrame.locator('.md-comments-card', {
      hasText: 'Edited comment text in native preview',
    });
    await expect(editedCard).toBeVisible({ timeout: 5000 });

    // 6. Refresh preview and verify changes are persisted in storage across reload
    await vscode.page.waitForTimeout(3000);
    await runCommand('Markdown Comments: Refresh Preview');
    await vscode.page.waitForTimeout(3000);
    const reloadedCard = previewFrame.locator('.md-comments-card', {
      hasText: 'Edited comment text in native preview',
    });
    await expect(reloadedCard).toBeVisible({ timeout: 10000 });
    const persistedReaction = reloadedCard.locator('.md-comments-reaction-chip').first();
    await expect(persistedReaction).toBeVisible({ timeout: 5000 });

    // Verify preview layout and document remain intact and visible (NOT blank/empty screen)
    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeVisible({ timeout: 5000 });
    const mainDoc = previewFrame.locator('.md-comments-document');
    await expect(mainDoc).toHaveCount(1);

    // 7. Test deleting the comment and confirming native VS Code modal
    const deleteBtn = reloadedCard.locator('[data-md-action="delete"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // Verify native VS Code confirmation dialog pops up
    const dialog = vscode.page.locator('.monaco-dialog-box');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Delete this');
    const confirmDeleteBtn = dialog.locator('a.monaco-button, button.monaco-button', {
      hasText: 'Delete',
    });
    await expect(confirmDeleteBtn).toBeVisible();
    await confirmDeleteBtn.click();

    // Verify card is deleted and removed from view
    await expect(reloadedCard).toBeHidden({ timeout: 5000 });

    // Close sidebar drawer and verify document is fully visible
    const closeBtn = previewFrame.locator('#md-comments-sidebar-close');
    await closeBtn.click();
    await expect(mainDoc).toBeVisible({ timeout: 5000 });
  });
});
