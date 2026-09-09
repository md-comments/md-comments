import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type Page,
  type FrameLocator,
  expect,
} from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

export interface VSCodeTestContext {
  electronApp: ElectronApplication;
  page: Page;
  workspaceDir: string;
  testDocPath: string;
  waitForExtensionActivation: () => Promise<void>;
  openCommandPalette: () => Promise<void>;
  runCommand: (commandTitle: string) => Promise<void>;
  openCommentPreview: () => Promise<void>;
  getCommentPreviewFrame: () => FrameLocator;
}

export const test = base.extend<{ vscode: VSCodeTestContext }>({
  // eslint-disable-next-line no-empty-pattern
  vscode: async ({}, use) => {
    const extensionPath = path.resolve(process.cwd(), 'vscode-extension');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vscode-e2e-'));
    const userDataDir = path.join(tempDir, 'user-data');
    const extensionsDir = path.join(tempDir, 'extensions');
    const workspaceDir = path.join(tempDir, 'workspace');
    await fs.mkdir(workspaceDir, { recursive: true });

    const userSettingsDir = path.join(userDataDir, 'User');
    await fs.mkdir(userSettingsDir, { recursive: true });
    const settingsPayload = JSON.stringify(
      {
        'editor.codeLens': true,
        'diffEditor.codeLens': true,
        'markdown.editor.codeLens.enabled': true,
        '[markdown]': {
          'editor.codeLens': true,
        },
      },
      null,
      2
    );
    await fs.writeFile(path.join(userSettingsDir, 'settings.json'), settingsPayload, 'utf8');

    const workspaceSettingsDir = path.join(workspaceDir, '.vscode');
    await fs.mkdir(workspaceSettingsDir, { recursive: true });
    await fs.writeFile(path.join(workspaceSettingsDir, 'settings.json'), settingsPayload, 'utf8');

    const testDocPath = path.join(workspaceDir, 'test-guide.md');
    const sampleMarkdown = [
      '# Guide to Documentation',
      '',
      'Welcome to the documentation guide. This is an introductory paragraph.',
      '',
      '## Key Features',
      '',
      'Markdown comments allow inline threads and page comments directly on rendered views.',
      '',
    ].join('\n');
    await fs.writeFile(testDocPath, sampleMarkdown, 'utf8');

    try {
      execSync('git init -b main', { cwd: workspaceDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: workspaceDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: workspaceDir, stdio: 'ignore' });
      execSync('git remote add origin https://github.com/md-comments/test-docs.git', {
        cwd: workspaceDir,
        stdio: 'ignore',
      });
      execSync('git add . && git commit -m "initial"', { cwd: workspaceDir, stdio: 'ignore' });
    } catch {
      // Git initialization optional
    }

    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

    const electronApp = await electron.launch({
      executablePath: vscodeExecutablePath,
      args: [
        '--disable-gpu',
        '--disable-updates',
        '--no-sandbox',
        '--disable-workspace-trust',
        '--skip-welcome',
        '--skip-release-notes',
        '--window-size=1440,900',
        `--extensionDevelopmentPath=${extensionPath}`,
        `--user-data-dir=${userDataDir}`,
        `--extensions-dir=${extensionsDir}`,
        workspaceDir,
        testDocPath,
      ],
    });

    const childProc = electronApp.process();
    childProc.stdout?.on('data', (d) => process.stdout.write(d));
    childProc.stderr?.on('data', (d) => process.stderr.write(d));

    const page = await electronApp.firstWindow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForLoadState('domcontentloaded');

    // Helper to wait until extension is activated via status bar indicator
    const waitForExtensionActivation = async () => {
      const editorTab = page.getByRole('tab', { name: 'test-guide.md' });
      if (await editorTab.isVisible()) {
        await editorTab.click();
      }
      const statusItem = page.locator('[id="md-comments.md-preview-comments"]');
      await expect(statusItem).toBeVisible({ timeout: 25000 });
    };

    // Helper to open command palette
    const openCommandPalette = async () => {
      await page.locator('.monaco-workbench').click({ position: { x: 50, y: 50 } });
      await page.keyboard.press('F1');
      await page.waitForSelector('.quick-input-widget', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(300);
    };

    // Helper to run a command via command palette
    const runCommand = async (commandTitle: string) => {
      await openCommandPalette();
      await page.keyboard.type(commandTitle, { delay: 30 });
      await page.keyboard.press('Enter');
      await page
        .waitForSelector('.quick-input-widget', { state: 'hidden', timeout: 5000 })
        .catch(() => {});
    };

    // Helper to open comment preview panel
    const openCommentPreview = async () => {
      await waitForExtensionActivation();
      await page.locator('.monaco-editor').first().click();
      const toggleBtn = page.getByRole('button', {
        name: 'Markdown Comments: Toggle Comment Preview',
      });
      await expect(toggleBtn).toBeVisible({ timeout: 5000 });
      await toggleBtn.click();
    };

    // Helper to get webview frame locator (outer workbench iframe -> inner active content iframe)
    const getCommentPreviewFrame = (): FrameLocator => {
      return page.frameLocator('iframe.webview').frameLocator('iframe#active-frame');
    };

    const context: VSCodeTestContext = {
      electronApp,
      page,
      workspaceDir,
      testDocPath,
      waitForExtensionActivation,
      openCommandPalette,
      runCommand,
      openCommentPreview,
      getCommentPreviewFrame,
    };

    try {
      await use(context);
    } finally {
      try {
        await electronApp.close();
      } catch {
        // App may have already exited
      }
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  },
});

export { expect } from '@playwright/test';
