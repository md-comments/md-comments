import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';

// Mock VS Code module before importing extension sources
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: path.resolve(__dirname, '..'),
          toString: () => path.resolve(__dirname, '..'),
        },
      },
    ],
    getWorkspaceFolder: vi.fn().mockReturnValue({
      uri: { fsPath: path.resolve(__dirname, '..'), toString: () => path.resolve(__dirname, '..') },
    }),
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn(),
      inspect: vi.fn().mockReturnValue({}),
    }),
  },
  window: {
    createStatusBarItem: vi.fn().mockReturnValue({
      show: vi.fn(),
      hide: vi.fn(),
    }),
  },
  authentication: {
    getSession: vi.fn().mockResolvedValue(undefined),
  },
  commands: {
    executeCommand: vi.fn().mockResolvedValue(undefined),
  },
  Uri: {
    file: (p: string) => ({ fsPath: p, toString: () => p }),
    parse: (p: string) => ({ fsPath: p, toString: () => p }),
    joinPath: (base: any, ...segments: string[]) => ({
      fsPath: path.join(base.fsPath || '', ...segments),
      toString: () => path.join(base.fsPath || '', ...segments),
    }),
  },
  Disposable: class {
    dispose() {}
  },
  StatusBarAlignment: { Right: 2 },
}));

import {
  setGitHubDisplayName,
  getGitHubDisplayName,
  authorDisplayLabel,
  clearGitHubDisplayNameCache,
} from '../vscode-extension/src/githubDisplayNames';
import {
  getAuthor,
  getAuthorDisplayName,
  setCachedAuthorDisplayName,
  clearAuthorCache,
} from '../vscode-extension/src/author';
import { getMarkdownEngine } from '../vscode-extension/src/markdownRender';

describe('VS Code Author Display Name and Typography', () => {
  beforeEach(() => {
    clearGitHubDisplayNameCache();
    clearAuthorCache();
  });

  it('correctly sets and retrieves GitHub display names in cache', () => {
    setGitHubDisplayName('mstrelex', 'Marat Strelets');
    expect(getGitHubDisplayName('mstrelex')).toBe('Marat Strelets');
    expect(authorDisplayLabel('mstrelex')).toBe('Marat Strelets');
  });

  it('falls back to raw login if no display name is cached', () => {
    expect(getGitHubDisplayName('unknownuser')).toBeUndefined();
    expect(authorDisplayLabel('unknownuser')).toBe('unknownuser');
  });

  it('resolves author display name for current user', async () => {
    const author = await getAuthor();
    expect(author).toBeDefined();

    const displayName = await getAuthorDisplayName();
    expect(displayName).toBeDefined();
    expect(typeof displayName).toBe('string');
    expect(displayName.length).toBeGreaterThan(0);
  });

  it('handles case-insensitive display name lookups', () => {
    setGitHubDisplayName('Mstrelex', 'Marat Strelets');
    expect(getGitHubDisplayName('mstrelex')).toBe('Marat Strelets');
    expect(getGitHubDisplayName('MSTRELEX')).toBe('Marat Strelets');
    expect(authorDisplayLabel('mstrelex')).toBe('Marat Strelets');
  });

  it('resolves author display name for current user via provider when cache is cleared', async () => {
    const author = await getAuthor();
    expect(author).toBeDefined();

    setCachedAuthorDisplayName('Test Display Name');
    clearGitHubDisplayNameCache();
    // authorDisplayLabel for current user should resolve to display name via registered provider
    expect(authorDisplayLabel(author)).toBe('Test Display Name');
  });

  it('emits data-md-current-author and data-md-current-author-name in markdown preview footer', () => {
    const md = getMarkdownEngine();
    const readmePath = path.resolve(__dirname, '../README.md');
    const markdown = '# Test Document\n\nSome test text.';
    const output = md.render(markdown, {
      currentDocument: { fsPath: readmePath, toString: () => readmePath },
      currentAuthor: 'mstrelex',
      currentAuthorName: 'Marat Strelets',
    });

    expect(output).toContain('data-md-current-author="mstrelex"');
    expect(output).toContain('data-md-current-author-name="Marat Strelets"');
    expect(output).toContain('&quot;mstrelex&quot;:&quot;Marat Strelets&quot;');
  });
});
