import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Refresh Button Centering & Geometry Across All Interfaces', () => {
  const readCss = (relPath: string) => fs.readFileSync(path.resolve(__dirname, relPath), 'utf8');

  it('verifies VS Code extension preview.css centers refresh button icon with inline-flex', () => {
    const css = readCss('../vscode-extension/media/preview.css');
    // Extract .md-comments-sidebar-icon-btn block
    const match = css.match(/\.md-comments-sidebar-icon-btn\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const block = match![1];

    expect(block).toMatch(/display:\s*inline-flex;/);
    expect(block).toMatch(/align-items:\s*center;/);
    expect(block).toMatch(/justify-content:\s*center;/);
    expect(block).toMatch(/width:\s*2rem;/);
    expect(block).toMatch(/height:\s*2rem;/);
    expect(block).toMatch(/box-sizing:\s*border-box;/);

    // Verify SVG child reset
    expect(css).toMatch(/\.md-comments-sidebar-icon-btn\s+svg\s*\{[^}]*display:\s*block;/);
    expect(css).toMatch(/\.md-comments-sidebar-icon-btn\s+svg\s*\{[^}]*margin:\s*0;/);
  });

  it('verifies Obsidian plugin styles.css defines centered .md-comments-sidebar-icon-btn', () => {
    const css = readCss('../obsidian-plugin/styles.css');
    const match = css.match(/\.md-comments-sidebar-icon-btn\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const block = match![1];

    expect(block).toMatch(/display:\s*inline-flex;/);
    expect(block).toMatch(/align-items:\s*center;/);
    expect(block).toMatch(/justify-content:\s*center;/);
    expect(block).toMatch(/width:\s*1\.75rem;/);
    expect(block).toMatch(/height:\s*1\.75rem;/);
    expect(block).toMatch(/padding:\s*0;/);
    expect(block).toMatch(/box-sizing:\s*border-box;/);

    expect(css).toContain('.md-comments-sidebar-header-actions');
    expect(css).toMatch(/\.md-comments-sidebar-icon-btn\s+svg\s*\{[^}]*display:\s*block;/);
    expect(css).toMatch(/\.md-comments-sidebar-icon-btn\.is-refreshing\s+svg/);
  });

  it('verifies Starlight plugin comments.css standardizes .md-comments-drawer-refresh to 28px square', () => {
    const css = readCss('../starlight-plugin/src/client/styles/comments.css');
    const match = css.match(/\.md-comments-drawer-refresh\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const block = match![1];

    expect(block).toMatch(/display:\s*inline-flex;/);
    expect(block).toMatch(/align-items:\s*center;/);
    expect(block).toMatch(/justify-content:\s*center;/);
    expect(block).toMatch(/width:\s*28px;/);
    expect(block).toMatch(/height:\s*28px;/);
    expect(block).toMatch(/padding:\s*0;/);

    expect(css).toMatch(/\.md-comments-drawer-refresh\s+svg\s*\{[^}]*display:\s*block;/);
    expect(css).toMatch(/\.md-comments-drawer-refresh\.is-refreshing\s+svg/);
  });

  it('verifies Chrome extension sidebar.css standardizes .refresh-btn to 28px square', () => {
    const css = readCss('../chrome-extension/src/sidebar.css');
    const match = css.match(/\.refresh-btn[^{]*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const block = match![1];

    expect(block).toMatch(/display:\s*inline-flex;/);
    expect(block).toMatch(/align-items:\s*center;/);
    expect(block).toMatch(/justify-content:\s*center;/);
    expect(block).toMatch(/width:\s*28px;/);
    expect(block).toMatch(/height:\s*28px;/);
    expect(block).toMatch(/padding:\s*0;/);

    expect(css).toMatch(/\.refresh-btn\s+svg[^}]*display:\s*block;/);
    expect(css).toMatch(/\.refresh-btn\.is-refreshing\s+svg/);
  });

  it('verifies Website demos embed css defines canonical .md-comments-drawer-refresh', () => {
    const htmlCss = readCss('../website/demo-html/embed/md-comments.css');
    const mockCss = readCss('../website/demo-mock/embed/md-comments.css');

    for (const css of [htmlCss, mockCss]) {
      const match = css.match(/\.md-comments-drawer-refresh\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const block = match![1];

      expect(block).toMatch(/display:\s*inline-flex;/);
      expect(block).toMatch(/align-items:\s*center;/);
      expect(block).toMatch(/justify-content:\s*center;/);
      expect(block).toMatch(/width:\s*28px;/);
      expect(block).toMatch(/height:\s*28px;/);
      expect(block).toMatch(/padding:\s*0;/);

      expect(css).toMatch(/\.md-comments-drawer-refresh\s+svg\s*\{[^}]*display:\s*block;/);
      expect(css).toMatch(/\.md-comments-drawer-refresh\.is-refreshing\s+svg/);
    }
  });

  it('verifies Shared canonical components.css defines .mdc-drawer-refresh', () => {
    const css = readCss('../shared/styles/components.css');
    const match = css.match(/\.mdc-drawer-refresh\s*\{([^}]+)\}/);
    expect(match).not.toBeNull();
    const block = match![1];

    expect(block).toMatch(/display:\s*inline-flex;/);
    expect(block).toMatch(/align-items:\s*center;/);
    expect(block).toMatch(/justify-content:\s*center;/);
    expect(block).toMatch(/width:\s*28px;/);
    expect(block).toMatch(/height:\s*28px;/);
    expect(block).toMatch(/padding:\s*0;/);

    expect(css).toMatch(/\.mdc-drawer-refresh\s+svg\s*\{[^}]*display:\s*block;/);
    expect(css).toMatch(/\.mdc-drawer-refresh\.is-refreshing\s+svg/);
  });

  it('verifies Chrome extension aligns .refresh-btn and .close-btn with matching 28px square geometry and SVG centering', () => {
    const css = readCss('../chrome-extension/src/sidebar.css');
    const contentTs = fs.readFileSync(
      path.resolve(__dirname, '../chrome-extension/src/content.ts'),
      'utf8'
    );

    // Assert both .refresh-btn and .close-btn are styled with 28px square flex-center
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*display:\s*inline-flex;/);
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*align-items:\s*center;/);
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*justify-content:\s*center;/);
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*width:\s*28px;/);
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*height:\s*28px;/);
    expect(css).toMatch(/\.close-btn[^{]*\{[^}]*padding:\s*0;/);

    // Assert SVG reset for .close-btn svg
    expect(css).toMatch(/\.close-btn\s+svg[^}]*display:\s*block;/);
    expect(css).toMatch(/\.close-btn\s+svg[^}]*margin:\s*0;/);

    // Assert content.ts uses ICON_CLOSE SVG instead of text entity &times;
    expect(contentTs).toContain('const ICON_CLOSE =');
    expect(contentTs).toContain('<button class="md-comments-header-btn close-btn"');
    expect(contentTs).not.toContain('<button class="close-btn">&times;</button>');
  });
});
