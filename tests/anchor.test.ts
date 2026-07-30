import { describe, it, expect } from 'vitest';
import { fnv1aHash, parseMarkdownAnchors, normalizeAnchorText } from '../shared/anchor';
import { escapeHtml } from '../shared/html';

describe('normalizeAnchorText', () => {
  it('collapses multiple whitespace characters and trims', () => {
    expect(normalizeAnchorText('  foo   bar \n baz ')).toBe('foo bar baz');
  });

  it('handles empty strings', () => {
    expect(normalizeAnchorText('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes standard HTML tags, ampersands, and single/double quotes', () => {
    expect(escapeHtml('<script>alert("hello" + \'world\') &</script>')).toBe(
      '&lt;script&gt;alert(&quot;hello&quot; + &#039;world&#039;) &amp;&lt;&#x2F;script&gt;'
    );
  });
});

describe('fnv1aHash', () => {
  it('generates consistent 8-character hex hashes', () => {
    expect(fnv1aHash('hello world')).toBe('d58b3fa7');
    expect(fnv1aHash('hello   world')).toBe('d58b3fa7'); // due to internal normalization
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

  it('extracts heading context correctly', () => {
    const md = `
# Main Header
Paragraph under header.

## Sub Header
Paragraph under sub header.
    `;
    const anchors = parseMarkdownAnchors(md);
    expect(anchors).toHaveLength(2);
    expect(anchors[0].heading_context).toBe('Main Header');
    expect(anchors[1].heading_context).toBe('Sub Header');
  });
});
