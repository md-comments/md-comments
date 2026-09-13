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
import { execSync, execFileSync } from 'node:child_process';

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

    const customWorkspaceDir = process.env.TEST_WORKSPACE_DIR;
    const isCustomWorkspace = !!customWorkspaceDir;
    const workspaceDir = isCustomWorkspace ? customWorkspaceDir : path.join(tempDir, 'workspace');
    if (!isCustomWorkspace) {
      await fs.mkdir(workspaceDir, { recursive: true });
    }

    const userSettingsDir = path.join(userDataDir, 'User');
    await fs.mkdir(userSettingsDir, { recursive: true });

    // Pre-populate confirmedExtensions in profile state.vscdb and globalStorage state.vscdb to prevent confirmation dialogs
    const profileDbPath = path.join(userSettingsDir, 'state.vscdb');
    const globalStorageDir = path.join(userSettingsDir, 'globalStorage');
    await fs.mkdir(globalStorageDir, { recursive: true });
    const globalDbPath = path.join(globalStorageDir, 'state.vscdb');
    const confirmedVal = JSON.stringify(['md-comments.md-preview-comments']).replace(/'/g, "''");
    const sql = `CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB); INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('extensionUrlHandler.confirmedExtensions', '${confirmedVal}');`;
    try {
      execFileSync('sqlite3', [profileDbPath, sql], { stdio: 'ignore' });
      execFileSync('sqlite3', [globalDbPath, sql], { stdio: 'ignore' });
    } catch {
      // sqlite3 fallback
    }

    // Also populate ~/.vscode-shared/sharedStorage/state.vscdb
    try {
      const sharedStorageDir = path.join(os.homedir(), '.vscode-shared', 'sharedStorage');
      await fs.mkdir(sharedStorageDir, { recursive: true });
      const sharedDbPath = path.join(sharedStorageDir, 'state.vscdb');
      execFileSync('sqlite3', [sharedDbPath, sql], { stdio: 'ignore' });
    } catch {
      // ignore
    }

    const settingsPayload = JSON.stringify(
      {
        'window.dialogStyle': 'custom',
        'editor.codeLens': true,
        'diffEditor.codeLens': true,
        'markdown.editor.codeLens.enabled': true,
        'markdown.preview.openMarkdownLinks': 'inEditor',
        'extensions.confirmedUriHandlerExtensionIds': ['md-comments.md-preview-comments'],
        '[markdown]': {
          'editor.codeLens': true,
        },
      },
      null,
      2
    );
    await fs.writeFile(path.join(userSettingsDir, 'settings.json'), settingsPayload, 'utf8');

    if (!isCustomWorkspace) {
      const workspaceSettingsDir = path.join(workspaceDir, '.vscode');
      await fs.mkdir(workspaceSettingsDir, { recursive: true });
      await fs.writeFile(path.join(workspaceSettingsDir, 'settings.json'), settingsPayload, 'utf8');
    }

    const testDocPath = process.env.TEST_DOC_PATH
      ? path.resolve(workspaceDir, process.env.TEST_DOC_PATH)
      : path.join(workspaceDir, isCustomWorkspace ? 'README.md' : 'test-guide.md');

    if (!isCustomWorkspace) {
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
        execSync('git config user.email "test@example.com"', {
          cwd: workspaceDir,
          stdio: 'ignore',
        });
        const testRepoOwner = process.env.TEST_REPO_OWNER || 'md-comments';
        const testRepoName = process.env.TEST_REPO_NAME || 'md-comments-test';
        execSync(`git remote add origin https://github.com/${testRepoOwner}/${testRepoName}.git`, {
          cwd: workspaceDir,
          stdio: 'ignore',
        });
        execSync('git add . && git commit -m "initial"', { cwd: workspaceDir, stdio: 'ignore' });
      } catch {
        // Git initialization optional
      }
    }

    let ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!ghToken) {
      try {
        ghToken = execFileSync('gh', ['auth', 'token'], {
          encoding: 'utf8',
          timeout: 3000,
          env: {
            ...process.env,
            PATH: ['/opt/homebrew/bin', '/usr/local/bin', process.env.PATH || ''].join(':'),
          },
        }).trim();
      } catch {
        /* ignore */
      }
    }

    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

    const electronApp = await electron.launch({
      executablePath: vscodeExecutablePath,
      env: {
        ...process.env,
        ...(ghToken ? { GITHUB_TOKEN: ghToken, GH_TOKEN: ghToken } : {}),
      },
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
      const docBase = path.basename(testDocPath);
      const editorTab = page.getByRole('tab', { name: docBase });
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
