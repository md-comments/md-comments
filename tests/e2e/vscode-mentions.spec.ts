import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Mentions Autocomplete E2E', () => {
  test('triggers @mention autocomplete menu, selects user, and renders mention link', async ({
    vscode,
  }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // 1. Switch to Page Comments tab
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 15000 });
    await pageTab.dispatchEvent('click');

    // 2. Open comment composer
    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    await expect(addCommentBtn).toBeVisible({ timeout: 5000 });
    await addCommentBtn.dispatchEvent('click');

    // 3. Seed mention users on footer
    await previewFrame.locator('.md-comments-footer').evaluate((footer) => {
      footer.setAttribute('data-md-mention-users', JSON.stringify(['octocat', 'alice', 'bob']));
    });

    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible();

    // 4. Type text including @oct to trigger mention autocomplete menu
    await textarea.fill('Hello ');
    await textarea.type('@oct', { delay: 50 });

    // 5. Verify mention menu pops up
    const mentionMenu = previewFrame.locator('#md-comments-mention-menu');
    await expect(mentionMenu).toBeVisible({ timeout: 5000 });

    const mentionItem = mentionMenu.locator('.md-comments-mention-item', { hasText: '@octocat' });
    await expect(mentionItem).toBeVisible();

    // 6. Click the mention suggestion
    await mentionItem.dispatchEvent('mousedown');

    // Verify textarea was updated with mention and trailing space
    const textareaVal = await textarea.inputValue();
    expect(textareaVal).toContain('@octocat');

    // 7. Submit comment
    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    // 8. Assert rendered comment card has clickable mention link
    // Ensure document tab is selected
    const activePageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await activePageTab.click();

    const card = previewFrame.locator('.md-comments-card').filter({ hasText: 'octocat' });
    await expect(card).toBeVisible({ timeout: 10000 });

    const mentionLink = card.locator('a.md-comments-mention');
    await expect(mentionLink).toBeVisible();
    await expect(mentionLink).toHaveText(/@octocat|@The Octocat/);
    await expect(mentionLink).toHaveAttribute('href', 'https://github.com/octocat');
  });
});
