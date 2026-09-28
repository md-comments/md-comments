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

import { renderCard, renderDocumentLayout } from '../vscode-extension/src/markdownItPlugin';

describe('VS Code Preview Reaction Toggle & Parity', () => {
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');
  const commentStoreTsPath = path.resolve(__dirname, '../vscode-extension/src/commentStore.ts');

  it('renders data-md-users, data-md-is-mine="true", and active class when currentAuthor matches', () => {
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
      [],
      false,
      undefined,
      false,
      undefined,
      false,
      'alice'
    );

    expect(cardHtml).toContain('data-md-emoji="👍"');
    expect(cardHtml).toContain('data-md-users="[&quot;alice&quot;,&quot;bob&quot;]"');
    expect(cardHtml).toContain('data-md-is-mine="true"');
    expect(cardHtml).toMatch(
      /class="[^"]*md-comments-reaction-chip[^"]*md-comments-reaction-active active[^"]*"[^>]*data-md-emoji="👍"/
    );

    expect(cardHtml).toContain('data-md-emoji="🎉"');
    expect(cardHtml).toContain('data-md-users="[&quot;charlie&quot;]"');
    expect(cardHtml).toMatch(/data-md-emoji="🎉"[^>]*data-md-is-mine="false"/);
  });

  it('renders data-md-is-mine="false" and no active class when currentAuthor does not match', () => {
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
      [],
      false,
      undefined,
      false,
      undefined,
      false,
      'dave'
    );

    expect(cardHtml).toContain('data-md-emoji="👍"');
    expect(cardHtml).toContain('data-md-is-mine="false"');
    expect(cardHtml).not.toMatch(
      /class="[^"]*md-comments-reaction-active active[^"]*"[^>]*data-md-emoji="👍"/
    );
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
    expect(previewWebviewJs).toContain('data-md-users');
    expect(previewWebviewJs).toContain('syncReactionStates');
  });

  it('verifies preview.js toggleReactionOptimistic handles isMine parity and data-md-users updates', () => {
    const previewJs = fs.readFileSync(previewJsPath, 'utf8');

    expect(previewJs).toContain('function toggleReactionOptimistic(');
    expect(previewJs).toContain("existingChip.getAttribute('data-md-is-mine') === 'true'");
    expect(previewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'false')");
    expect(previewJs).toContain("existingChip.setAttribute('data-md-is-mine', 'true')");
    expect(previewJs).toContain('count -= 1;');
    expect(previewJs).toContain('count += 1;');
    expect(previewJs).toContain('data-md-users');
    expect(previewJs).toContain('authorsMatchClient');
  });

  it('verifies renderDocumentLayout renders reaction chips with isMine="true" when currentAuthor matches', () => {
    const mockCtx = {
      blocks: [],
      placements: [],
      comments: {
        version: '1',
        inline_comments: [],
        page_comments: [
          {
            id: 'page-1',
            author: 'alice',
            created_at: '2026-09-24T10:00:00Z',
            body: 'Hello page',
            reactions: [{ emoji: '👍', users: ['alice'] }],
            replies: [],
          },
        ],
      },
      mdPath: '/path/to/test.md',
      currentAuthor: 'alice',
    };

    const layoutHtml = renderDocumentLayout('<p>Document</p>', mockCtx as any, '', '');
    expect(layoutHtml).toContain('data-md-emoji="👍"');
    expect(layoutHtml).toContain('data-md-is-mine="true"');
    expect(layoutHtml).toMatch(
      /class="[^"]*md-comments-reaction-chip[^"]*md-comments-reaction-active active[^"]*"[^>]*data-md-emoji="👍"/
    );
  });
});
