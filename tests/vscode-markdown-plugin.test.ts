import { describe, it, expect, vi } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
  },
}));

import { ICON_FAB } from '../vscode-extension/src/markdownItPlugin';
import { getMarkdownEngine } from '../vscode-extension/src/markdownRender';
import fs from 'fs';
import path from 'path';

describe('VS Code Markdown Preview FAB and Icon Parity', () => {
  it('exports ICON_FAB matching the Chrome Extension FAB logo SVG structure', () => {
    expect(ICON_FAB).toBeDefined();

    // Verify SVG root attributes
    expect(ICON_FAB).toContain('viewBox="0 0 512 512"');
    expect(ICON_FAB).toContain('class="md-comments-fab-icon"');
    expect(ICON_FAB).toContain('width="28"');
    expect(ICON_FAB).toContain('height="28"');
    expect(ICON_FAB).toContain('aria-hidden="true"');

    // Verify brand speech bubble path (#24292f fill with #ffffff stroke)
    expect(ICON_FAB).toContain('fill="#24292f"');
    expect(ICON_FAB).toContain('stroke="#ffffff"');
    expect(ICON_FAB).toContain('stroke-width="20"');
    expect(ICON_FAB).toContain(
      'd="M 136 64 L 376 64 C 424 64 456 96 456 144 L 456 304 C 456 352 424 384 376 384 L 216 384 C 184 384 150 404 126 428 C 118 436 104 430 104 418 L 104 384 C 72 380 56 352 56 304 L 56 144 C 56 96 88 64 136 64 Z"'
    );

    // Verify branded "MD" text path (#ffffff fill)
    expect(ICON_FAB).toContain(
      'd="M 132 168 L 164 168 L 192 232 L 220 168 L 252 168 L 252 280 L 226 280 L 226 212 L 201 268 L 183 268 L 158 212 L 158 280 L 132 280 Z M 276 168 L 324 168 C 358 168 380 188 380 224 C 380 260 358 280 324 280 L 276 280 Z M 302 192 L 302 256 L 322 256 C 342 256 352 246 352 224 C 352 202 342 192 322 192 Z"'
    );
  });

  it('renders fenced code blocks with highlight.js syntax highlighting in getMarkdownEngine', () => {
    const md = getMarkdownEngine();

    const sample = '```typescript\nconst greeting: string = "hello world";\n```';
    const output = md.render(sample);

    expect(output).toContain('<pre><code class="hljs language-typescript">');
    expect(output).toContain('<span class="hljs-keyword">const</span>');
    expect(output).toContain('<span class="hljs-string">&quot;hello world&quot;</span>');
  });

  it('falls back safely for code blocks with unknown languages', () => {
    const md = getMarkdownEngine();

    const sample = '```unknownlang\nplain text content\n```';
    const output = md.render(sample);

    expect(output).toContain('<pre><code class="hljs">plain text content');
  });

  it('verifies vscode-markdown.css includes theme typography, tables, and hljs definitions', () => {
    const cssPath = path.resolve(__dirname, '../vscode-extension/media/vscode-markdown.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('--vscode-markdown-font-family');
    expect(css).toContain('.md-comments-document table');
    expect(css).toContain('.md-comments-document blockquote');
    expect(css).toContain('.hljs-keyword');
    expect(css).toContain('.hljs-string');
    expect(css).toContain('body.vscode-dark');
    expect(css).toContain('body.vscode-light');
  });

  it('verifies preview.css and previewSidebar.js hide the FAB when comments panel is open', () => {
    const cssPath = path.resolve(__dirname, '../vscode-extension/media/preview.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, 'utf8');

    // Confirm that when sidebar is open, FAB is hidden
    const openFabMatch = css.match(
      /\.md-comments-layout\.md-comments-sidebar-open\s+\.md-comments-fab\s*\{([^}]+)\}/
    );
    expect(openFabMatch).not.toBeNull();
    expect(openFabMatch![1]).toMatch(/display:\s*none/);

    const jsPath = path.resolve(__dirname, '../vscode-extension/media/previewSidebar.js');
    expect(fs.existsSync(jsPath)).toBe(true);
    const js = fs.readFileSync(jsPath, 'utf8');
    expect(js).toContain("fab.style.display = open ? 'none' : ''");
  });
});
