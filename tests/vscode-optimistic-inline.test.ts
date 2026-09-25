import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VS Code Preview Instant Optimistic Inline Highlighting', () => {
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');

  it('verifies preview-webview.js immediately wires comment highlight on optimistic inline card insertion', () => {
    const code = fs.readFileSync(previewWebviewJsPath, 'utf8');

    expect(code).toContain('targetList.append(article);');
    expect(code).toContain('if (!isPage) {');
    expect(code).toContain("const card = article.querySelector('.md-comments-card');");
    expect(code).toContain("typeof window.mdCommentsWireCommentHighlight === 'function'");
    expect(code).toContain('window.mdCommentsWireCommentHighlight(card);');
  });

  it('verifies preview.js immediately wires comment highlight on optimistic inline card insertion', () => {
    const code = fs.readFileSync(previewJsPath, 'utf8');

    expect(code).toContain('targetList.append(article);');
    expect(code).toContain('if (!isPage) {');
    expect(code).toContain("const card = article.querySelector('.md-comments-card');");
    expect(code).toContain("typeof window.mdCommentsWireCommentHighlight === 'function'");
    expect(code).toContain('window.mdCommentsWireCommentHighlight(card);');
  });

  it('verifies optimistic cards correctly map anchor.index to data-md-paragraph-index', () => {
    const webviewCode = fs.readFileSync(previewWebviewJsPath, 'utf8');
    const previewCode = fs.readFileSync(previewJsPath, 'utf8');

    expect(webviewCode).toContain(
      "anchor.index !== undefined\n              ? ' data-md-paragraph-index=\"' + anchor.index + '\"'"
    );
    expect(previewCode).toContain(
      "anchor.index !== undefined\n              ? ' data-md-paragraph-index=\"' + anchor.index + '\"'"
    );
  });

  it('verifies optimistic cards display Just now with concrete locale title tooltip', () => {
    const webviewCode = fs.readFileSync(previewWebviewJsPath, 'utf8');
    const previewCode = fs.readFileSync(previewJsPath, 'utf8');

    expect(webviewCode).toContain('escapeHtml(new Date().toLocaleString())');
    expect(webviewCode).toContain('>Just now</span>');
    expect(previewCode).toContain('escapeHtml(new Date().toLocaleString())');
    expect(previewCode).toContain('>Just now</span>');
  });
});
