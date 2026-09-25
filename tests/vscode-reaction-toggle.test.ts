import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn((_key: string, defaultVal: unknown) => defaultVal),
    }),
    getWorkspaceFolder: vi.fn().mockReturnValue({
      uri: { fsPath: process.cwd(), toString: () => process.cwd() },
    }),
  },
  Uri: {
    file: (p: string) => ({ fsPath: p, toString: () => `file://${p}`, scheme: 'file', path: p }),
    parse: (uri: string) => ({ fsPath: uri, toString: () => uri, scheme: 'file', path: uri }),
  },
  commands: {
    executeCommand: vi.fn(),
  },
}));

import { renderCard } from '../vscode-extension/src/markdownItPlugin';

describe('VS Code Preview Reaction Toggle & Parity', () => {
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');
  const commentStoreTsPath = path.resolve(__dirname, '../vscode-extension/src/commentStore.ts');

  it('renders data-md-users, data-md-is-mine, and active class in renderCard reactions', () => {
    const cardHtml = renderCard(
      'c-1',
      'alice',
      '2026-09-24T10:00:00Z',
      'Test reaction rendering',
      'inline',
      [
        { emoji: '👍', users: ['alice', 'bob'] },
        { emoji: '🎉', users: ['charlie'] },
      ],
      []
    );

    expect(cardHtml).toContain('data-md-emoji="👍"');
    expect(cardHtml).toContain('data-md-users="[&quot;alice&quot;,&quot;bob&quot;]"');
    expect(cardHtml).toContain('data-md-is-mine=');
    expect(cardHtml).toContain('data-md-emoji="🎉"');
    expect(cardHtml).toContain('data-md-users="[&quot;charlie&quot;]"');
  });

  it('verifies commentStore.ts applyReactionToggle uses authorsMatch to match user logins', () => {
    const code = fs.readFileSync(commentStoreTsPath, 'utf8');
    expect(code).toContain('function applyReactionToggle(');
    expect(code).toContain('existing.users.findIndex((u) => authorsMatch(u, user))');
  });

  it('verifies toggleReactionOptimistic decrements and removes chip when isMine is true', () => {
    const previewWebviewJs = fs.readFileSync(previewWebviewJsPath, 'utf8');

    expect(previewWebviewJs).toContain('function toggleReactionOptimistic(');
    expect(previewWebviewJs).toContain("existingChip.getAttribute('data-md-is-mine') === 'true'");
    expect(previewWebviewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'false')");
    expect(previewWebviewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'true')");
    expect(previewWebviewJs).toContain('count -= 1;');
    expect(previewWebviewJs).toContain('existingChip.remove();');
  });

  it('verifies preview.js toggleReactionOptimistic handles isMine parity', () => {
    const previewJs = fs.readFileSync(previewJsPath, 'utf8');

    expect(previewJs).toContain('function toggleReactionOptimistic(');
    expect(previewJs).toContain("existingChip.getAttribute('data-md-is-mine') === 'true'");
    expect(previewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'false')");
    expect(previewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'true')");
    expect(previewJs).toContain('count -= 1;');
    expect(previewJs).toContain('count += 1;');
  });
});
