import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'node:vm';

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

describe('VS Code Preview Duplicate Phrase Occurrence Anchoring', () => {
  const inlineAnchorsJsPath = path.resolve(__dirname, '../vscode-extension/media/inlineAnchors.js');
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');

  it('renders data-md-anchor-occurrence in renderCard when provided in inlineMeta', () => {
    const cardHtml = renderCard(
      'c-1',
      'alice',
      '2026-09-24T12:00:00Z',
      'Comment on second occurrence',
      'inline',
      [],
      [],
      false,
      { paragraphIndex: 2, anchorText: 'duplicate phrase', occurrence: 1 }
    );
    expect(cardHtml).toContain('data-md-paragraph-index="2"');
    expect(cardHtml).toContain('data-md-anchor-text="duplicate phrase"');
    expect(cardHtml).toContain('data-md-anchor-occurrence="1"');
  });

  it('renders data-md-anchor-occurrence in renderDocumentLayout sidebar threads', () => {
    const layoutHtml = renderDocumentLayout(
      '<p>paragraph</p>',
      {
        contentHtml: '<p>paragraph</p>',
        blocks: [
          {
            index: 0,
            line: 0,
            text: 'Duplicate text first and duplicate text second.',
            anchor_text: 'Duplicate text first and duplicate text second.',
            anchor_hash: 'hash-0',
          },
        ],
        comments: {
          path: 'test.md',
          version: '1',
          source: 'test',
          page_comments: [],
          inline_comments: [
            {
              id: 'c-occ-0',
              author: 'alice',
              body: 'First occurrence',
              created_at: '2026-09-24T10:00:00Z',
              paragraph_index: 0,
              anchor_text: 'duplicate text',
              anchor_hash: 'hash-0',
              anchor_occurrence: 0,
              replies: [],
              reactions: [],
            },
            {
              id: 'c-occ-1',
              author: 'bob',
              body: 'Second occurrence',
              created_at: '2026-09-24T10:01:00Z',
              paragraph_index: 0,
              anchor_text: 'duplicate text',
              anchor_hash: 'hash-0',
              anchor_occurrence: 1,
              replies: [],
              reactions: [],
            },
          ],
        },
        placements: [],
        orphanedCount: 0,
        activeTab: 'inline',
      } as any,
      'test.md',
      ''
    );

    expect(layoutHtml).toContain('data-md-comment-id="c-occ-0"');
    expect(layoutHtml).toContain('data-md-anchor-occurrence="0"');
    expect(layoutHtml).toContain('data-md-comment-id="c-occ-1"');
    expect(layoutHtml).toContain('data-md-anchor-occurrence="1"');
  });

  it('verifies insertOptimisticCard in preview-webview.js and preview.js preserves occurrence attribute', () => {
    const webviewCode = fs.readFileSync(previewWebviewJsPath, 'utf8');
    const previewCode = fs.readFileSync(previewJsPath, 'utf8');

    expect(webviewCode).toContain(
      "anchor.occurrence !== undefined\n            ? ' data-md-anchor-occurrence=\"' + anchor.occurrence + '\"'"
    );
    expect(previewCode).toContain(
      "anchor.occurrence !== undefined\n            ? ' data-md-anchor-occurrence=\"' + anchor.occurrence + '\"'"
    );
  });

  it('verifies inlineAnchors.js findNeedleRange targets the exact occurrence requested', () => {
    const inlineAnchorsJs = fs.readFileSync(inlineAnchorsJsPath, 'utf8');
    const context: any = {
      window: {},
      document: {
        addEventListener: () => {},
        readyState: 'complete',
        querySelectorAll: () => [],
        querySelector: () => null,
        body: {},
      },
      MutationObserver: class {
        observe() {}
        disconnect() {}
      },
      setTimeout,
      clearTimeout,
    };
    vm.createContext(context);
    vm.runInContext(inlineAnchorsJs, context);

    const win = context.window;
    expect(typeof win.mdCommentsFindNeedleRange).toBe('function');
    const rawText = 'alpha beta alpha gamma alpha delta';

    // Occurrence 0 -> first 'alpha' at index 0
    const m0 = win.mdCommentsFindNeedleRange(rawText, 'alpha', 0);
    expect(m0).toEqual({ start: 0, length: 5 });

    // Occurrence 1 -> second 'alpha' at index 11
    const m1 = win.mdCommentsFindNeedleRange(rawText, 'alpha', 1);
    expect(m1).toEqual({ start: 11, length: 5 });

    // Occurrence 2 -> third 'alpha' at index 23
    const m2 = win.mdCommentsFindNeedleRange(rawText, 'alpha', 2);
    expect(m2).toEqual({ start: 23, length: 5 });

    // Out-of-bounds occurrence -> fallback to occurrence 0
    const mFallback = win.mdCommentsFindNeedleRange(rawText, 'alpha', 99);
    expect(mFallback).toEqual({ start: 0, length: 5 });
  });

  it('handles flexible whitespace and normalized matching with occurrence index', () => {
    const inlineAnchorsJs = fs.readFileSync(inlineAnchorsJsPath, 'utf8');
    const context: any = {
      window: {},
      document: {
        addEventListener: () => {},
        readyState: 'complete',
        querySelectorAll: () => [],
        querySelector: () => null,
        body: {},
      },
      MutationObserver: class {
        observe() {}
        disconnect() {}
      },
      setTimeout,
      clearTimeout,
    };
    vm.createContext(context);
    vm.runInContext(inlineAnchorsJs, context);

    const win = context.window;
    const rawText = 'hello   world foo hello \t world bar hello world';

    // Occurrence 0 with normalized space
    const m0 = win.mdCommentsFindNeedleRange(rawText, 'hello world', 0);
    expect(m0).toEqual({ start: 0, length: 13 });

    // Occurrence 1
    const m1 = win.mdCommentsFindNeedleRange(rawText, 'hello world', 1);
    expect(m1).toEqual({ start: 18, length: 13 });

    // Occurrence 2
    const m2 = win.mdCommentsFindNeedleRange(rawText, 'hello world', 2);
    expect(m2).toEqual({ start: 36, length: 11 });
  });

  it('verifies wireCommentHighlight extracts data-md-anchor-occurrence and passes it to wrapAnchorText', () => {
    const inlineAnchorsJs = fs.readFileSync(inlineAnchorsJsPath, 'utf8');
    expect(inlineAnchorsJs).toContain("card.getAttribute('data-md-anchor-occurrence')");
    expect(inlineAnchorsJs).toContain(
      'wrapAnchorText(container, anchorText, commentId, occurrenceIndex);'
    );
  });
});
