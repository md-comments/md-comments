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

import { parseMarkdownAnchors } from '../shared/anchor';
import { placeInlineComments, isOrphanedPlacement } from '../shared/placement';
import { getMarkdownEngine } from '../vscode-extension/src/markdownRender';
import { addInlineComment } from '../vscode-extension/src/commentStore';
import type { InlineComment } from '../shared/types';
import fs from 'fs';
import path from 'path';

describe('VS Code Table and Complex Element Anchoring', () => {
  const problemMdPath = path.resolve(__dirname, 'fixtures/problem-with-orphan.md');
  const markdown = fs.readFileSync(problemMdPath, 'utf8');
  const blocks = parseMarkdownAnchors(markdown);

  it('correctly parses table rows as anchor blocks in problem-with-orphan.md', () => {
    // Row 11: Confluence migration ... Milvus embedding notes
    const confluenceRow = blocks.find((b) => b.anchor_text.includes('Milvus embedding notes'));
    expect(confluenceRow).toBeDefined();
    expect(confluenceRow?.paragraph_index).toBe(11);
    expect(confluenceRow?.anchor_hash).toBe('72ad02b3');

    // Row 12: Scripts ... Embedding, optional Confluence import
    const scriptsRow = blocks.find((b) => b.anchor_text.includes('Embedding, optional Confluence'));
    expect(scriptsRow).toBeDefined();
    expect(scriptsRow?.paragraph_index).toBe(12);
    expect(scriptsRow?.anchor_hash).toBe('0ccd84ba');
  });

  it('renders markdown tables with data-md-* attributes on tr elements', () => {
    const md = getMarkdownEngine();
    const env: any = {
      currentDocument: { fsPath: problemMdPath, toString: () => problemMdPath },
    };
    const rendered = md.render(markdown, env);

    // Verify tr has data-md-paragraph-index and data-md-anchor-hash for the Confluence row
    expect(rendered).toContain('data-md-paragraph-index="11"');
    expect(rendered).toContain('data-md-anchor-hash="72ad02b3"');
    expect(rendered).toContain(
      'data-md-anchor-text="Confluence migration src/content/docs/confluence-migration/ Import scripts, known Confluence sources, and Milvus embedding notes."'
    );

    // Verify tr has data-md-paragraph-index and data-md-anchor-hash for the Scripts row
    expect(rendered).toContain('data-md-paragraph-index="12"');
    expect(rendered).toContain('data-md-anchor-hash="0ccd84ba"');
  });

  it('renders headings with data-md-* attributes in markdown preview', () => {
    const md = getMarkdownEngine();
    const env: any = {
      currentDocument: { fsPath: problemMdPath, toString: () => problemMdPath },
    };
    const rendered = md.render(markdown, env);

    // Verify H1 and H2 tags receive anchor attributes
    expect(rendered).toMatch(
      /<h1[^>]+data-md-paragraph-index="0"[^>]+data-md-anchor-hash="82eeff87"/
    );
    expect(rendered).toMatch(
      /<h2[^>]+data-md-paragraph-index="4"[^>]+data-md-anchor-hash="d90785f2"/
    );
  });

  it('marks tr with md-comments-paragraph-marked when an inline comment is placed on it', () => {
    const comment: InlineComment = {
      id: 'c_test_table',
      author: 'maratstrelets',
      anchor_text: 'embedding',
      anchor_hash: '72ad02b3',
      paragraph_index: 11,
      heading_context: 'What lives here',
      body: 'Embedding discussion',
      created_at: new Date().toISOString(),
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    expect(placements[0].paragraphIndex).toBe(11);
    expect(isOrphanedPlacement(blocks, placements[0])).toBe(false);
  });

  it('prevents false orphan detection when comment is placed via fuzzy match with empty anchor_hash', () => {
    const legacyComment: InlineComment = {
      id: 'c_legacy',
      author: 'maratstrelets',
      anchor_text: 'embedding',
      anchor_hash: '', // legacy empty hash
      paragraph_index: 33, // drifted index
      heading_context: '',
      body: 'Legacy comment with empty hash',
      created_at: new Date().toISOString(),
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [legacyComment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    // Even with empty hash, isOrphanedPlacement recognizes the valid fuzzy match and does NOT mark as orphan
    expect(isOrphanedPlacement(blocks, placements[0])).toBe(false);
  });

  it('preserves anchor_occurrence in addInlineComment', async () => {
    const dummyUri = { fsPath: problemMdPath, toString: () => problemMdPath } as any;
    const { comment } = await addInlineComment(dummyUri, {
      body: 'Occurrence test',
      anchor_text: 'embedding',
      anchor_hash: '72ad02b3',
      paragraph_index: 11,
      heading_context: 'What lives here',
      anchor_occurrence: 0,
    });

    expect(comment.anchor_occurrence).toBe(0);
    expect(comment.anchor_hash).toBe('72ad02b3');
    expect(comment.paragraph_index).toBe(11);
  });
});
