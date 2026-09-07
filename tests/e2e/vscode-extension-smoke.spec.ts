import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Smoke Tests', () => {
  test('launches VS Code and registers extension commands', async ({ vscode }) => {
    const { page, waitForExtensionActivation, openCommandPalette } = vscode;

    // Verify workbench is loaded and extension is active
    await expect(page.locator('.monaco-workbench')).toBeVisible({ timeout: 15000 });
    await waitForExtensionActivation();

    // Open command palette
    await openCommandPalette();

    // Type command prefix (with leading > for commands in VS Code quickinput)
    const quickInput = page.locator('.quick-input-box input');
    await expect(quickInput).toBeAttached();
    await quickInput.fill('>Markdown Comments:');

    // Wait for filtered list entries
    const listEntry = page.locator('.quick-input-list-entry').first();
    await expect(listEntry).toBeVisible({ timeout: 10000 });

    // Assert that mdComments commands are present
    const entryText = await page.locator('.quick-input-list').innerText();
    expect(entryText).toContain('Markdown Comments: Open Comment Preview');
    expect(entryText).toContain('Markdown Comments: Refresh Preview');

    // Close command palette with Escape
    await page.keyboard.press('Escape');
  });

  test('verifies status bar item is present for markdown comments', async ({ vscode }) => {
    const { page, waitForExtensionActivation } = vscode;
    await waitForExtensionActivation();

    // Status bar item shows either $(github) or $(warning) Not Logged In
    const statusItem = page.locator('[id="md-comments.md-preview-comments"]');
    await expect(statusItem).toBeVisible({ timeout: 5000 });
  });
});
