import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Thread Lifecycle E2E', () => {
  test('supports full thread lifecycle: create comment, reply, edit, and resolve', async ({
    vscode,
  }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // 1. Switch to Page Comments tab
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 15000 });
    await pageTab.dispatchEvent('click');

    // 2. Create initial root comment
    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    await expect(addCommentBtn).toBeVisible({ timeout: 5000 });
    await addCommentBtn.dispatchEvent('click');

    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    const rootCommentText = 'Root thread comment for lifecycle testing';
    await textarea.fill(rootCommentText);

    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    const card = previewFrame.locator('.md-comments-card', { hasText: rootCommentText });
    await expect(card).toBeVisible({ timeout: 10000 });

    // 3. Add a Reply to the root comment
    const replyBtn = card.locator('[data-md-action="reply"]');
    await expect(replyBtn).toBeVisible({ timeout: 5000 });
    await replyBtn.dispatchEvent('click');

    const replyTextarea = card.locator('textarea');
    await expect(replyTextarea).toBeVisible({ timeout: 5000 });
    const replyText = 'Nested reply acknowledging root comment';
    await replyTextarea.fill(replyText);

    const submitReplyBtn = card.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitReplyBtn.dispatchEvent('click');

    // Verify reply renders inside the card's reply list
    const replyItem = card.locator('.md-comments-reply', { hasText: replyText });
    await expect(replyItem).toBeVisible({ timeout: 10000 });

    // 4. Edit the root comment
    const editBtn = card.locator('[data-md-action="edit"]').first();
    await editBtn.evaluate((el) => el.removeAttribute('hidden'));
    await editBtn.dispatchEvent('click');

    const editComposer = card.locator('.md-comments-panel-composer');
    await expect(editComposer).toBeVisible({ timeout: 5000 });
    const editTextarea = editComposer.locator('textarea');
    await expect(editTextarea).toBeVisible();
    const updatedBody = 'Updated root comment text (post-edit)';
    await editTextarea.fill(updatedBody);

    const saveEditBtn = editComposer.locator('[data-action="submit"]');
    await saveEditBtn.dispatchEvent('click');

    const updatedCard = previewFrame.locator('.md-comments-card', { hasText: updatedBody });
    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    // 5. Resolve the thread
    const resolveBtn = updatedCard.locator('[data-md-action="resolve"]');
    await expect(resolveBtn).toBeVisible({ timeout: 5000 });
    await resolveBtn.dispatchEvent('click');

    // Verify card gains resolved badge and reopen/unresolve button
    const resolvedBadge = updatedCard.locator('.md-comments-badge-resolved');
    await expect(resolvedBadge).toBeVisible({ timeout: 10000 });
    const unresolveBtn = updatedCard.locator('[data-md-action="unresolve"]');
    await expect(unresolveBtn).toBeVisible({ timeout: 5000 });
  });
});
