import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'node:module';
const requireFromVsCode = createRequire(
  path.resolve(__dirname, '../vscode-extension/package.json')
);
const MarkdownIt = requireFromVsCode('markdown-it');

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
    parse: (uri: string) => {
      const p = uri.replace(/^file:\/\//, '');
      return { fsPath: p, toString: () => uri, scheme: 'file', path: p };
    },
  },
  commands: {
    executeCommand: vi.fn(),
  },
}));

import { extendMarkdownIt } from '../vscode-extension/src/markdownItPlugin';

describe('VS Code Preview List Item & Blockquote Anchoring', () => {
  const inlineAnchorsJsPath = path.resolve(__dirname, '../vscode-extension/media/inlineAnchors.js');
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );

  it('attaches anchor block attributes to tight list items during rendering', () => {
    const md = new MarkdownIt();
    extendMarkdownIt(md);

    const markdown = `# Shopping List\n\n- Milk\n- Apples\n- Bread\n`;
    const tmpFile = path.join(os.tmpdir(), `shopping-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, markdown, 'utf8');

    try {
      const rendered = md.render(markdown, {
        currentDocument: {
          fsPath: tmpFile,
          toString: () => `file://${tmpFile}`,
          scheme: 'file',
          path: tmpFile,
        },
        comments: { page_comments: [], inline_comments: [] },
        isLoading: false,
      });

      // Verify list items receive paragraph class and anchor data attributes
      expect(rendered).toContain('<li class="md-comments-paragraph"');
      expect(rendered).toContain('data-md-paragraph-index=');
      expect(rendered).toContain('data-md-anchor-hash=');
      expect(rendered).toContain('data-md-anchor-text="Milk"');
      expect(rendered).toContain('data-md-anchor-text="Apples"');
      expect(rendered).toContain('data-md-anchor-text="Bread"');
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('attaches anchor block attributes to blockquotes during rendering', () => {
    const md = new MarkdownIt();
    extendMarkdownIt(md);

    const markdown = `# Architecture Notes\n\n> Simple is better than complex.\n`;
    const tmpFile = path.join(os.tmpdir(), `quotes-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, markdown, 'utf8');

    try {
      const rendered = md.render(markdown, {
        currentDocument: {
          fsPath: tmpFile,
          toString: () => `file://${tmpFile}`,
          scheme: 'file',
          path: tmpFile,
        },
        comments: { page_comments: [], inline_comments: [] },
        isLoading: false,
      });

      // Verify paragraph inside blockquote receives paragraph class and anchor data attributes
      expect(rendered).toContain('data-md-paragraph-index=');
      expect(rendered).toContain('data-md-anchor-hash=');
      expect(rendered).toContain('data-md-anchor-text="Simple is better than complex."');
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });

  it('verifies inlineAnchors.js findContainer includes blockquote in element selector', () => {
    const code = fs.readFileSync(inlineAnchorsJsPath, 'utf8');
    expect(code).toContain(
      "document.querySelector('td' + sel + ', li' + sel + ', tr' + sel + ', blockquote' + sel)"
    );
  });

  it('verifies preview-webview.js BLOCK_SELECTOR and findParagraphFromNode support li and blockquote', () => {
    const code = fs.readFileSync(previewWebviewJsPath, 'utf8');
    expect(code).toContain('BLOCK_SELECTOR');
    expect(code).toContain('li');
    expect(code).toContain('blockquote');
  });
});
