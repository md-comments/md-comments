import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('vscode', () => ({
  env: {
    uriScheme: 'vscode',
  },
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn((key: string, defaultVal: unknown) => defaultVal),
    }),
    getWorkspaceFolder: vi.fn().mockReturnValue({
      uri: { fsPath: process.cwd(), toString: () => process.cwd() },
    }),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
    parse: (uri: string) => ({ fsPath: uri, toString: () => uri }),
  },
}));

import { getMarkdownEngine } from '../vscode-extension/src/markdownRender';

describe('VS Code Native Preview Actions & Dialog Consistency', () => {
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');
  const previewJs = fs.readFileSync(previewJsPath, 'utf8');

  it('verifies preview.js does NOT use command: links that cause blank page navigation', () => {
    // The previous bug was `href = 'command:' + COMMAND + ...` and `messenger.click()`,
    // which caused Chromium to navigate to an unknown protocol and show a blank white page.
    expect(previewJs).not.toContain("command:' + COMMAND");
    expect(previewJs).not.toContain('command:mdComments.handlePreviewAction');
    expect(previewJs).not.toContain('messenger.click()');
  });

  it('verifies preview.js does NOT contain legacy prompt modals or window.confirm', () => {
    // Unify dialogs: no popup prompt modal, no floating inline composer with dummy icons, no window.confirm
    expect(previewJs).not.toContain('showPromptComposer');
    expect(previewJs).not.toContain('md-comments-prompt-dialog');
    expect(previewJs).not.toContain('window.confirm');
  });

  it('verifies preview.js implements modern in-place composers matching preview-webview.js', () => {
    expect(previewJs).toContain('showInlineCardReplyComposer');
    expect(previewJs).toContain('showInlineCardEditComposer');
    expect(previewJs).toContain('showSidebarNewCommentComposer');
    expect(previewJs).toContain('applyPendingAnchorHighlight');
    expect(previewJs).toContain('clearPendingAnchorHighlight');
    expect(previewJs).toContain('md-comments-panel-composer');
  });

  it('verifies preview.js dispatches actions via safe URI bridge without page navigation', () => {
    expect(previewJs).toContain('md-comments-uri-bridge');
    expect(previewJs).toContain('getUriScheme');
    expect(previewJs).toContain('toBase64Url');
    expect(previewJs).toContain('bridge.src = uri');
  });

  it('verifies markdownItPlugin renders data-md-uri-scheme and hidden iframe bridge in footer', () => {
    const md = getMarkdownEngine();
    const readmePath = path.resolve(__dirname, '../README.md');
    const markdown = fs.readFileSync(readmePath, 'utf8');
    const output = md.render(markdown, {
      currentDocument: { fsPath: readmePath, toString: () => readmePath },
    });

    expect(output).toContain('data-md-uri-scheme="vscode"');
    expect(output).toContain('id="md-comments-uri-bridge"');
  });
});
