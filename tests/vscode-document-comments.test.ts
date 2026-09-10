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
