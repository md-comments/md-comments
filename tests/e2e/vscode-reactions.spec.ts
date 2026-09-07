import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Reactions E2E', () => {
  test('adds and toggles emoji reactions via popover picker', async ({ vscode }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // 1. Switch to Page Comments tab and create a comment
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 15000 });
    await pageTab.dispatchEvent('click');

    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    await expect(addCommentBtn).toBeVisible({ timeout: 5000 });
    await addCommentBtn.dispatchEvent('click');

    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible();
    const commentBody = 'Testing emoji reactions in VS Code';
    await textarea.fill(commentBody);

    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    const card = previewFrame.locator('.md-comments-card', { hasText: commentBody });
    await expect(card).toBeVisible({ timeout: 10000 });

    // 2. Click reaction picker button
    const reactPickerBtn = card.locator('[data-md-action="react-picker"]');
    await expect(reactPickerBtn).toBeVisible({ timeout: 5000 });
    await reactPickerBtn.dispatchEvent('click');

    // 3. Verify emoji popover appears
    const emojiPopover = previewFrame.locator('#md-comments-emoji-popover');
    await expect(emojiPopover).toBeVisible({ timeout: 5000 });

    // 4. Click thumbs-up emoji
    const thumbsUpBtn = emojiPopover.locator('.md-comments-emoji-btn', { hasText: '👍' });
    await expect(thumbsUpBtn).toBeVisible();
    await thumbsUpBtn.dispatchEvent('click');

    // 5. Verify reaction chip appears on the card
    const reactionChip = card.locator('.md-comments-reaction-chip', { hasText: '👍' });
    await expect(reactionChip).toBeVisible({ timeout: 10000 });

    // 6. Click reaction chip to toggle reaction off
    await reactionChip.dispatchEvent('click');
    await expect(reactionChip).toBeHidden({ timeout: 10000 });
  });
});
