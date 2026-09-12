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
    file: (p: string) => ({ fsPath: p, toString: () => p }),
    parse: (uri: string) => ({ fsPath: uri, toString: () => uri }),
  },
}));

import { renderCard, renderDocumentLayout } from '../vscode-extension/src/markdownItPlugin';

describe('Cross-Interface Badge Styling & DOM Parity', () => {
  const sharedTokensPath = path.resolve(__dirname, '../shared/styles/design-tokens.css');
  const sharedComponentsPath = path.resolve(__dirname, '../shared/styles/components.css');
  const chromeSidebarCssPath = path.resolve(__dirname, '../chrome-extension/src/sidebar.css');
  const vscodePreviewCssPath = path.resolve(__dirname, '../vscode-extension/media/preview.css');
  const obsidianStylesCssPath = path.resolve(__dirname, '../obsidian-plugin/styles.css');
  const starlightCommentsCssPath = path.resolve(
    __dirname,
    '../starlight-plugin/src/client/styles/comments.css'
  );

  it('verifies shared design tokens and components specify canonical badge rules', () => {
    const tokens = fs.readFileSync(sharedTokensPath, 'utf8');
    expect(tokens).toContain('--mdc-badge-radius: 10px;');
    expect(tokens).toContain('--mdc-badge-font-size: 9px;');
    expect(tokens).toContain('--mdc-color-warning');
    expect(tokens).toContain('--mdc-color-success');

    const components = fs.readFileSync(sharedComponentsPath, 'utf8');
    expect(components).toContain('.mdc-badge');
    expect(components).toContain('.mdc-badge--orphan');
    expect(components).toContain('.mdc-badge--resolved');
    expect(components).toContain('.mdc-badge--type');
    expect(components).toContain('.mdc-tab-count');
  });

  it('verifies VS Code preview.css adheres to GitHub extension badge specifications', () => {
    const css = fs.readFileSync(vscodePreviewCssPath, 'utf8');
    expect(css).toContain('--warn-color: var(--mdc-color-warning, #d29922);');
    expect(css).toContain('--success-color: var(--mdc-color-success, #3fb950);');

    // Status Badges
    expect(css).toContain('.md-comments-badge.orphan');
    expect(css).toContain('.md-comments-badge.resolved');
    expect(css).toContain('rgba(210, 153, 34, 0.15)'); // Amber background for orphan
    expect(css).toContain('rgba(63, 185, 80, 0.15)'); // Green background for resolved

    // Border radius 10px pill
    expect(css).toMatch(/\.md-comments-badge\s*\{[^}]*border-radius:\s*10px;/);

    // Tab count pill
    expect(css).toMatch(/\.md-comments-tab-count\s*\{[^}]*border-radius:\s*10px;/);

    // FAB count badge
    expect(css).toContain('.md-comments-fab .badge-count');
    expect(css).toContain('.md-comments-fab .badge-loading');
  });

  it('verifies Obsidian styles.css adheres to GitHub extension badge specifications', () => {
    const css = fs.readFileSync(obsidianStylesCssPath, 'utf8');

    // Status Badges
    expect(css).toContain('.md-comments-badge.orphan');
    expect(css).toContain('.md-comments-badge.resolved');
    expect(css).toContain('#d29922'); // Amber color for orphan
    expect(css).toContain('#3fb950'); // Green color for resolved

    // Border radius 10px pill
    expect(css).toMatch(/\.md-comments-badge\s*\{[^}]*border-radius:\s*10px;/);

    // Tab count pill
    expect(css).toMatch(/\.md-comments-tab-count\s*\{[^}]*border-radius:\s*10px;/);
  });

  it('verifies Starlight and Chrome extension badge styling parity', () => {
    const chromeCss = fs.readFileSync(chromeSidebarCssPath, 'utf8');
    const starlightCss = fs.readFileSync(starlightCommentsCssPath, 'utf8');

    expect(chromeCss).toContain('.md-comments-badge.orphan');
    expect(chromeCss).toContain('.md-comments-badge.resolved');
    expect(starlightCss).toContain('.md-comments-badge.orphan');
    expect(starlightCss).toContain('.md-comments-badge.resolved');

    expect(chromeCss).toContain('#md-comments-fab-toggle .badge-count');
    expect(chromeCss).toContain('.md-comments-tab-count');
  });

  it('verifies VS Code markdownItPlugin generates capitalized badge text and dual classes for backward compatibility', () => {
    // 1. Orphan comment card
    const orphanCardHtml = renderCard(
      'c-orphan',
      'alice',
      '2026-01-01T00:00:00Z',
      'Orphan body',
      'inline',
      [],
      [],
      true, // orphaned
      { paragraphIndex: 0, anchorText: 'hello' },
      false // resolved
    );
    expect(orphanCardHtml).toContain(
      '<span class="md-comments-badge orphan md-comments-badge-orphan">Orphaned</span>'
    );

    // 2. Resolved comment card
    const resolvedCardHtml = renderCard(
      'c-resolved',
      'bob',
      '2026-01-01T00:00:00Z',
      'Resolved body',
      'inline',
      [],
      [],
      false, // orphaned
      { paragraphIndex: 0, anchorText: 'world' },
      true // resolved
    );
    expect(resolvedCardHtml).toContain(
      '<span class="md-comments-badge resolved md-comments-badge-resolved">Resolved</span>'
    );

    // 3. Page comment card
    const pageCardHtml = renderCard(
      'c-page',
      'carol',
      '2026-01-01T00:00:00Z',
      'Page comment body',
      'page',
      [],
      [],
      false,
      undefined,
      false
    );
    expect(pageCardHtml).toContain(
      '<span class="md-comments-badge md-comments-type-label">Page comment</span>'
    );

    // 4. Document layout with FAB badges
    const mockCtx: any = {
      blocks: [],
      comments: {
        file_path: 'test.md',
        git_ref: 'refs/heads/main',
        inline_comments: [],
        page_comments: [
          {
            id: 'c1',
            author: 'alice',
            created_at: '2026-01-01T00:00:00Z',
            body: 'Open comment',
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      },
      placements: [],
      rawMarkdown: '# Doc',
    };

    const layoutHtml = renderDocumentLayout('<p>Doc content</p>', mockCtx, '', '');
    expect(layoutHtml).toContain(
      '<span class="badge-count" style="display: inline-block;">1</span>'
    );
    expect(layoutHtml).toContain('<span class="badge-loading" style="display: none;');
  });
});
