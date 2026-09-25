import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VS Code Preview Triple-Click Paragraph Boundary Resolution', () => {
  const previewWebviewJsPath = path.resolve(
    __dirname,
    '../vscode-extension/media/preview-webview.js'
  );
  const previewJsPath = path.resolve(__dirname, '../vscode-extension/media/preview.js');

  it('verifies preview-webview.js contains boundary resolution fallback for triple-click text selection', () => {
    const code = fs.readFileSync(previewWebviewJsPath, 'utf8');
    expect(code).toContain('let p = findParagraphFromNode(range.commonAncestorContainer);');
    expect(code).toContain('if (!p) {');
    expect(code).toContain('let startNode = range.startContainer;');
    expect(code).toContain('const startMatch = findParagraphFromNode(startNode);');
    expect(code).toContain('const endMatch = findParagraphFromNode(range.endContainer);');
    expect(code).toContain('p = startMatch;');
  });

  it('verifies preview.js contains identical boundary resolution fallback for native preview', () => {
    const code = fs.readFileSync(previewJsPath, 'utf8');
    expect(code).toContain('let p = findParagraphFromNode(range.commonAncestorContainer);');
    expect(code).toContain('if (!p) {');
    expect(code).toContain('let startNode = range.startContainer;');
    expect(code).toContain('const startMatch = findParagraphFromNode(startNode);');
    expect(code).toContain('const endMatch = findParagraphFromNode(range.endContainer);');
    expect(code).toContain('p = startMatch;');
  });

  // Test the algorithmic boundary resolution directly
  function findParagraphFromNode(node: any): any {
    if (!node) return null;
    const el = node.nodeType === 3 ? node.parentElement : node;
    if (!el) return null;
    if (el.dataset && el.dataset.mdParagraphIndex !== undefined) return el;
    if (el.tagName === 'P' || el.tagName === 'LI' || el.tagName === 'TR') return el;
    if (el.closest) {
      return el.closest('[data-md-paragraph-index], p, li, tr');
    }
    return null;
  }

  function resolveSelectionParagraph(range: any) {
    let p = findParagraphFromNode(range.commonAncestorContainer);
    if (!p) {
      let startNode = range.startContainer;
      if (
        startNode &&
        startNode.nodeType === 1 &&
        range.startOffset < (startNode.childNodes ? startNode.childNodes.length : 0)
      ) {
        startNode = startNode.childNodes[range.startOffset];
      }
      const startMatch = findParagraphFromNode(startNode);
      if (startMatch) {
        const endMatch = findParagraphFromNode(range.endContainer);
        if (
          !endMatch ||
          endMatch === startMatch ||
          range.endOffset === 0 ||
          (range.endContainer &&
            range.endContainer.contains &&
            range.endContainer.contains(startMatch))
        ) {
          p = startMatch;
        }
      }
    }
    return p;
  }

  it('resolves paragraph immediately when selection commonAncestorContainer is the paragraph itself', () => {
    const pEl = {
      nodeType: 1,
      tagName: 'P',
      dataset: { mdParagraphIndex: '2' },
      closest: (sel: string) => (sel.includes('P') ? pEl : null),
    };
    const textNode = {
      nodeType: 3,
      textContent: 'Some selected text',
      parentElement: pEl,
    };
    const range = {
      commonAncestorContainer: textNode,
      startContainer: textNode,
      startOffset: 0,
      endContainer: textNode,
      endOffset: 18,
    };

    const resolved = resolveSelectionParagraph(range);
    expect(resolved).toBe(pEl);
  });

  it('resolves paragraph when triple-click expands commonAncestorContainer to root markdown container', () => {
    const rootContainer: any = {
      nodeType: 1,
      tagName: 'DIV',
      dataset: {},
      closest: () => null,
      childNodes: [],
      contains: (child: any) => rootContainer.childNodes.includes(child),
    };

    const pEl: any = {
      nodeType: 1,
      tagName: 'P',
      dataset: { mdParagraphIndex: '5' },
      parentElement: rootContainer,
      childNodes: [],
      closest: (sel: string) => (sel.includes('P') ? pEl : null),
      contains: (child: any) => pEl.childNodes.includes(child),
    };
    rootContainer.childNodes.push(pEl);

    const textNode = {
      nodeType: 3,
      textContent: 'Triple clicked full paragraph text',
      parentElement: pEl,
    };
    pEl.childNodes.push(textNode);

    // Browser behavior on triple click:
    // startContainer is inside the paragraph
    // endContainer is the parent container (or next sibling with offset 0)
    // commonAncestorContainer is the root container (DIV.markdown-body)
    const tripleClickRange = {
      commonAncestorContainer: rootContainer,
      startContainer: textNode,
      startOffset: 0,
      endContainer: rootContainer,
      endOffset: 1,
    };

    // Before fix: findParagraphFromNode(rootContainer) -> null -> rejected
    expect(findParagraphFromNode(tripleClickRange.commonAncestorContainer)).toBeNull();

    // After fix: boundary resolution recovers pEl
    const resolved = resolveSelectionParagraph(tripleClickRange);
    expect(resolved).toBe(pEl);
  });

  it('resolves paragraph when startContainer is rootContainer and startOffset points to child paragraph', () => {
    const rootContainer: any = {
      nodeType: 1,
      tagName: 'DIV',
      dataset: {},
      closest: () => null,
      childNodes: [],
      contains: (child: any) => rootContainer.childNodes.includes(child),
    };

    const pEl: any = {
      nodeType: 1,
      tagName: 'P',
      dataset: { mdParagraphIndex: '3' },
      parentElement: rootContainer,
      childNodes: [],
      closest: (sel: string) => (sel.includes('P') ? pEl : null),
    };
    rootContainer.childNodes.push(pEl);

    const range = {
      commonAncestorContainer: rootContainer,
      startContainer: rootContainer,
      startOffset: 0, // points to pEl in childNodes
      endContainer: rootContainer,
      endOffset: 1,
    };

    const resolved = resolveSelectionParagraph(range);
    expect(resolved).toBe(pEl);
  });

  it('does not resolve when selection spans across multiple distinct paragraphs', () => {
    const rootContainer: any = {
      nodeType: 1,
      tagName: 'DIV',
      dataset: {},
      closest: () => null,
      childNodes: [],
      contains: () => false,
    };

    const p1: any = {
      nodeType: 1,
      tagName: 'P',
      dataset: { mdParagraphIndex: '1' },
      parentElement: rootContainer,
      closest: (sel: string) => (sel.includes('P') ? p1 : null),
    };
    const p2: any = {
      nodeType: 1,
      tagName: 'P',
      dataset: { mdParagraphIndex: '2' },
      parentElement: rootContainer,
      closest: (sel: string) => (sel.includes('P') ? p2 : null),
    };

    const multiParaRange = {
      commonAncestorContainer: rootContainer,
      startContainer: p1,
      startOffset: 0,
      endContainer: p2,
      endOffset: 5,
    };

    const resolved = resolveSelectionParagraph(multiParaRange);
    expect(resolved).toBeNull();
  });
});
