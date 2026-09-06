import { describe, it, expect } from 'vitest';
import {
  fnv1aHash,
  parseMarkdownAnchors,
  normalizeAnchorText,
  findOccurrenceIndex,
} from '../shared/anchor';
import { escapeHtml } from '../shared/html';

describe('normalizeAnchorText', () => {
  it('collapses multiple whitespace characters and trims', () => {
    expect(normalizeAnchorText('  foo   bar \n baz ')).toBe('foo bar baz');
  });

  it('handles empty strings', () => {
    expect(normalizeAnchorText('')).toBe('');
  });

  it('strips inline markdown formatting tokens', () => {
    expect(normalizeAnchorText('**bold** *italic* ~~strike~~ `code` [link](http://x.com)')).toBe(
      'bold italic strike code link'
    );
  });
});

describe('escapeHtml', () => {
  it('escapes standard HTML tags, ampersands, and single/double quotes', () => {
    expect(escapeHtml('<script>alert("hello" + \'world\') &</script>')).toBe(
      '&lt;script&gt;alert(&quot;hello&quot; + &#039;world&#039;) &amp;&lt;&#x2F;script&gt;'
    );
  });
});

describe('fnv1aHash and computeAnchorId', () => {
  it('generates consistent 8-character hex hashes', () => {
    expect(fnv1aHash('hello world')).toBe('d58b3fa7');
    expect(fnv1aHash('hello   world')).toBe('d58b3fa7'); // due to internal normalization
  });

  it('computes anchor ID with and without paragraph index', async () => {
    const { computeAnchorId } = await import('../shared/anchor');
    expect(computeAnchorId('hello world')).toBe('a_d58b3fa7');
    expect(computeAnchorId('hello world', 2)).toBe('a_2_d58b3fa7');
  });
});

describe('parseMarkdownAnchors', () => {
  it('parses basic paragraphs and extracts anchors', () => {
    const md = 'Hello first paragraph.\n\nHello second paragraph.';
    const anchors = parseMarkdownAnchors(md);
    expect(anchors).toHaveLength(2);
    expect(anchors[0].anchor_text).toBe('Hello first paragraph.');
    expect(anchors[0].paragraph_index).toBe(0);
    expect(anchors[1].anchor_text).toBe('Hello second paragraph.');
    expect(anchors[1].paragraph_index).toBe(1);
  });

  it('skips fenced code blocks', () => {
    const md = `
This is prose.

\`\`\`javascript
console.log("hello code block");
\`\`\`

This is more prose.
    `;
    const anchors = parseMarkdownAnchors(md);
    expect(anchors).toHaveLength(2);
    expect(anchors[0].anchor_text).toBe('This is prose.');
    expect(anchors[1].anchor_text).toBe('This is more prose.');
  });

  it('extracts heading context correctly and includes headings as anchors', () => {
    const md = `
# Main Header
Paragraph under header.

## Sub Header
Paragraph under sub header.
    `;
    const anchors = parseMarkdownAnchors(md);
    expect(anchors).toHaveLength(4);
    expect(anchors[0].anchor_text).toBe('Main Header');
    expect(anchors[0].heading_context).toBe('Main Header');
    expect(anchors[1].anchor_text).toBe('Paragraph under header.');
    expect(anchors[1].heading_context).toBe('Main Header');
    expect(anchors[2].anchor_text).toBe('Sub Header');
    expect(anchors[2].heading_context).toBe('Sub Header');
    expect(anchors[3].anchor_text).toBe('Paragraph under sub header.');
    expect(anchors[3].heading_context).toBe('Sub Header');
  });

  it('parses markdown table rows as separate anchor blocks and normalizes pipes', () => {
    const md = `
| Key | Value |
| --- | --- |
| title | T9 Context Engine |
| summary | T9 ingests product data |
    `;
    const anchors = parseMarkdownAnchors(md);
    expect(anchors).toHaveLength(3);
    expect(anchors[0].anchor_text).toBe('Key Value');
    expect(anchors[1].anchor_text).toBe('title T9 Context Engine');
    expect(anchors[2].anchor_text).toBe('summary T9 ingests product data');
  });

  it('parses lists, blockquotes, and ignores blocks that normalize to empty text', () => {
    const md = `
- Bullet item one
* Bullet item two
1. Numbered item

> Blockquote insight statement

** **
`;
    const anchors = parseMarkdownAnchors(md);
    expect(anchors.length).toBeGreaterThanOrEqual(4);
    expect(anchors.some((a) => a.anchor_text === 'Bullet item one')).toBe(true);
    expect(anchors.some((a) => a.anchor_text === 'Blockquote insight statement')).toBe(true);
  });
});

describe('findOccurrenceIndex', () => {
  it('returns 0 when text only occurs once or text is empty', () => {
    expect(findOccurrenceIndex('hello world', 'hello', 0)).toBe(0);
    expect(findOccurrenceIndex('hello world', 'missing', 0)).toBe(0);
    expect(findOccurrenceIndex('', 'test', 0)).toBe(0);
    expect(findOccurrenceIndex('hello', '', 0)).toBe(0);
  });

  it('correctly identifies the closest occurrence index based on char offset', () => {
    // "T9" occurs at index 0, index 46, and index 63
    const fullText =
      'T9 is a context engine. Some services consume T9 via MCP. More T9 details here.';
    expect(findOccurrenceIndex(fullText, 'T9', 0)).toBe(0);
    expect(findOccurrenceIndex(fullText, 'T9', 10)).toBe(0);
    expect(findOccurrenceIndex(fullText, 'T9', 40)).toBe(1);
    expect(findOccurrenceIndex(fullText, 'T9', 48)).toBe(1);
    expect(findOccurrenceIndex(fullText, 'T9', 60)).toBe(2);
    expect(findOccurrenceIndex(fullText, 'T9', 80)).toBe(2);
  });

  it('handles regex compilation exceptions gracefully', () => {
    const origRegExp = globalThis.RegExp;
    try {
      (globalThis as any).RegExp = function () {
        throw new Error('Pattern compile error');
      };
      expect(findOccurrenceIndex('text', 'pattern', 0)).toBe(0);
    } finally {
      globalThis.RegExp = origRegExp;
    }
  });
});

describe('findBlockByIndex and findBlockByHash', () => {
  it('finds blocks by paragraph index and hash correctly', async () => {
    const { findBlockByIndex, findBlockByHash } = await import('../shared/anchor');
    const blocks = [
      {
        paragraph_index: 0,
        anchor_hash: 'hash-0',
        anchor_text: 'first block',
        heading_context: 'Intro',
      },
      {
        paragraph_index: 1,
        anchor_hash: 'hash-1',
        anchor_text: 'second block',
        heading_context: 'Intro',
      },
    ];

    expect(findBlockByIndex(blocks, 0)?.anchor_text).toBe('first block');
    expect(findBlockByIndex(blocks, 99)).toBeUndefined();

    expect(findBlockByHash(blocks, 'hash-1')?.anchor_text).toBe('second block');
    expect(findBlockByHash(blocks, 'missing-hash')).toBeUndefined();
  });
});
