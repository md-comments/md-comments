import { describe, it, expect, vi } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn((key: string, defaultVal: unknown) => defaultVal),
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

import {
  renderPageComposer,
  renderLoadingSkeleton,
  renderLoadError,
} from '../vscode-extension/src/markdownItPlugin';
import { getMarkdownEngine } from '../vscode-extension/src/markdownRender';
import fs from 'fs';
import path from 'path';

describe('VS Code Document Comments View Parity with GitHub Extension', () => {
  it('renders sticky page composer template with textarea and primary submit button', () => {
    const composerHtml = renderPageComposer();

    expect(composerHtml).toContain('class="page-composer md-comments-page-composer"');
    expect(composerHtml).toContain('id="page-composer"');
    expect(composerHtml).toContain('class="page-textarea md-comments-page-textarea"');
    expect(composerHtml).toContain('placeholder="Write a comment on this document..."');
    expect(composerHtml).toContain('class="composer-actions md-comments-composer-actions"');
    expect(composerHtml).toContain('submit-page-btn');
    expect(composerHtml).toContain('data-md-action="submit-page"');
    expect(composerHtml).toContain('>Send<');
  });

  it('renders loading skeleton for document discussions and inline annotations', () => {
    const pageSkeleton = renderLoadingSkeleton('page');
    expect(pageSkeleton).toContain('panel-loading-container');
    expect(pageSkeleton).toContain('md-comments-spinner');
    expect(pageSkeleton).toContain('Loading comments...');
    expect(pageSkeleton).toContain('Fetching document discussions from repository');
    expect(pageSkeleton).toContain('skeleton-shimmer');
    expect(pageSkeleton).toContain('comment-skeleton-card');

    const inlineSkeleton = renderLoadingSkeleton('inline');
    expect(inlineSkeleton).toContain('Fetching line annotations from repository');
    expect(inlineSkeleton).toContain('skeleton-quote');
  });

  it('renders error container with retry button on load failure', () => {
    const errorHtml = renderLoadError('Network connection timeout');
    expect(errorHtml).toContain('panel-error-container');
    expect(errorHtml).toContain('Failed to load comments');
    expect(errorHtml).toContain('Network connection timeout');
    expect(errorHtml).toContain('retry-load-btn');
    expect(errorHtml).toContain('data-md-action="refresh"');
  });

  it('renders document tab with page threads list, empty state, and page composer in markdown-it render', () => {
    const md = getMarkdownEngine();
    const markdown = '# Sample Document\n\nThis is paragraph content.';
    const readmePath = path.resolve(__dirname, '../README.md');
    const output = md.render(markdown, {
      currentDocument: { fsPath: readmePath, toString: () => readmePath },
      isLoading: false,
    });

    // Verify tabs
    expect(output).toContain('data-tab="page"');
    expect(output).toContain('<span>Document</span>');
    expect(output).toContain('page-tab-count');

    // Verify tab panel
    expect(output).toContain('id="tab-page"');
    expect(output).toContain('data-panel="page"');
    expect(output).toContain('id="page-threads"');

    // Verify empty state matching GitHub extension
    expect(output).toContain('No page discussion comments yet. Use the composer below to start.');

    // Verify embedded page composer
    expect(output).toContain('class="page-composer md-comments-page-composer"');
    expect(output).toContain('class="page-textarea md-comments-page-textarea"');
    expect(output).toContain('submit-page-btn');
  });

  it('renders shimmer loading skeleton and FAB loading state when opening panel for the first time while comments are loading', () => {
    const md = getMarkdownEngine();
    const markdown = '# Sample Document\n\nThis is paragraph content.';
    const readmePath = path.resolve(__dirname, '../README.md');
    const output = md.render(markdown, {
      currentDocument: { fsPath: readmePath, toString: () => readmePath },
      isLoading: true,
    });

    // Verify loading skeletons are rendered for both tabs
    expect(output).toContain('panel-loading-container');
    expect(output).toContain('md-comments-spinner');
    expect(output).toContain('Loading comments...');
    expect(output).toContain('Fetching line annotations from repository');
    expect(output).toContain('Fetching document discussions from repository');

    // Verify empty state is NOT shown while loading
    expect(output).not.toContain('No page discussion comments yet.');
    expect(output).not.toContain('No inline comments yet.');

    // Verify FAB widget shows loading state
    expect(output).toContain('class="md-comments-fab is-loading"');
    expect(output).toContain('class="badge-loading" style="display: inline-flex;"');
    expect(output).toContain('aria-busy="true"');
  });

  it('consistently keeps comments in chronological order aligned with GitHub', () => {
    const md = getMarkdownEngine();
    const markdown = '# Sample Document\n\nThis is paragraph content.';
    const readmePath = path.resolve(__dirname, '../README.md');

    const olderDate = '2026-09-01T10:00:00.000Z';
    const newerDate = '2026-09-12T12:00:00.000Z';

    const output = md.render(markdown, {
      currentDocument: { fsPath: readmePath, toString: () => readmePath },
      isLoading: false,
      comments: {
        page_comments: [
          {
            id: 'page-older',
            author: 'alice',
            body: 'First older comment',
            created_at: olderDate,
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'page-newer',
            author: 'bob',
            body: 'Second newer comment',
            created_at: newerDate,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        inline_comments: [
          {
            id: 'inline-older',
            author: 'alice',
            body: 'Older inline feedback',
            created_at: olderDate,
            anchor_text: 'Sample Document',
            anchor_hash: '123',
            paragraph_index: 0,
            heading_context: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
          {
            id: 'inline-newer',
            author: 'bob',
            body: 'Newer inline feedback',
            created_at: newerDate,
            anchor_text: 'Sample Document',
            anchor_hash: '123',
            paragraph_index: 0,
            heading_context: '',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      },
    });

    // In page threads, older comment appears first, followed chronologically by newer comment
    const pageNewerIdx = output.indexOf('Second newer comment');
    const pageOlderIdx = output.indexOf('First older comment');
    expect(pageNewerIdx).toBeGreaterThan(-1);
    expect(pageOlderIdx).toBeGreaterThan(-1);
    expect(pageOlderIdx).toBeLessThan(pageNewerIdx);

    // In inline threads, older comment appears first, followed chronologically by newer comment
    const inlineNewerIdx = output.indexOf('Newer inline feedback');
    const inlineOlderIdx = output.indexOf('Older inline feedback');
    expect(inlineNewerIdx).toBeGreaterThan(-1);
    expect(inlineOlderIdx).toBeGreaterThan(-1);
    expect(inlineOlderIdx).toBeLessThan(inlineNewerIdx);
  });

  it('verifies preview.css contains full parity styles for page composer, reply composer, shimmer skeleton, and spinners', () => {
    const cssPath = path.resolve(__dirname, '../vscode-extension/media/preview.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const css = fs.readFileSync(cssPath, 'utf8');

    // Composer styles
    expect(css).toContain('.page-composer');
    expect(css).toContain('.page-textarea');
    expect(css).toContain('.submit-page-btn');
    expect(css).toContain('.composer-actions');

    // Inline reply styles
    expect(css).toContain('.reply-composer');
    expect(css).toContain('.reply-input');
    expect(css).toContain('.fallback-reply-composer');
    expect(css).toContain('.fallback-reply-textarea');
    expect(css).toContain('.fallback-cancel-btn');
    expect(css).toContain('.fallback-submit-btn');

    // Empty state
    expect(css).toContain('.empty-state');

    // Skeletons and spinners
    expect(css).toContain('.panel-loading-container');
    expect(css).toContain('.skeleton-shimmer');
    expect(css).toContain('.md-comments-spinner');
    expect(css).toContain('button.loading');
    expect(css).toContain('.submit-page-btn.loading');
    expect(css).toContain('.panel-error-container');
  });
});
