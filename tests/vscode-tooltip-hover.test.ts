import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VS Code Preview Speech Bubble Tooltip on Hover', () => {
  const inlineAnchorsJsPath = path.resolve(__dirname, '../vscode-extension/media/inlineAnchors.js');
  const previewCssPath = path.resolve(__dirname, '../vscode-extension/media/preview.css');

  it('verifies preview.css defines complete .md-comments-tooltip styles and animations', () => {
    const css = fs.readFileSync(previewCssPath, 'utf8');

    expect(css).toContain('.md-comments-tooltip {');
    expect(css).toContain('position: absolute;');
    expect(css).toContain('z-index: 999995;');
    expect(css).toContain('max-width: 300px;');
    expect(css).toContain('.md-comments-tooltip.visible {');
    expect(css).toContain('.md-comments-tooltip.arrow-bottom::after {');
    expect(css).toContain('.md-comments-tooltip.arrow-top::after {');
    expect(css).toContain('.md-comments-tooltip .tooltip-header {');
    expect(css).toContain('.md-comments-tooltip .tooltip-avatar {');
    expect(css).toContain('.md-comments-tooltip .tooltip-author {');
    expect(css).toContain('.md-comments-tooltip .tooltip-time {');
    expect(css).toContain('.md-comments-tooltip .tooltip-body {');
  });

  it('verifies inlineAnchors.js implements showCommentTooltip and hideCommentTooltip with bubble extraction', () => {
    const code = fs.readFileSync(inlineAnchorsJsPath, 'utf8');

    expect(code).toContain('function hideCommentTooltip()');
    expect(code).toContain('function showCommentTooltip(targetEl, commentId)');
    expect(code).toContain('.md-comments-card[data-md-comment-id="');
    expect(code).toContain('.md-comments-author, .author-name, .comment-author');
    expect(code).toContain('.md-comments-avatar, .comment-avatar');
    expect(code).toContain('.md-comments-time, .comment-time');
    expect(code).toContain('.md-comments-body, .comment-body');
    expect(code).toContain("tooltip.className = 'md-comments-tooltip arrow-bottom';");
    expect(code).toContain("tooltip.setAttribute('role', 'tooltip');");
    expect(code).toContain("tooltip.classList.add('arrow-top')");
    expect(code).toContain("window.addEventListener('scroll', hideCommentTooltip");
  });

  it('verifies inlineAnchors.js binds hover to showCommentTooltip and hideCommentTooltip', () => {
    const code = fs.readFileSync(inlineAnchorsJsPath, 'utf8');

    expect(code).toContain('function bindHover(el, commentId)');
    expect(code).toContain('showCommentTooltip(el, commentId);');
    expect(code).toContain('hideCommentTooltip();');
    expect(code).toContain('function bindParagraphMarked(container)');
    expect(code).toContain('showCommentTooltip(container, ids[0]);');
    expect(code).toContain('function unwrapAnchor(commentId)');
  });

  it('verifies inlineAnchors.js exports mdCommentsShowTooltip and mdCommentsHideTooltip', () => {
    const code = fs.readFileSync(inlineAnchorsJsPath, 'utf8');

    expect(code).toContain('window.mdCommentsShowTooltip = showCommentTooltip;');
    expect(code).toContain('window.mdCommentsHideTooltip = hideCommentTooltip;');
  });

  it('verifies tooltip positioning logic with top, bottom, and clipping boundaries', () => {
    // Direct simulation of tooltip positioning algorithm from inlineAnchors.js
    function computeTooltipPosition(
      rect: { top: number; bottom: number; left: number; width: number },
      tooltipRect: { width: number; height: number },
      viewport: { scrollY: number; scrollX: number; innerWidth: number }
    ) {
      let top = rect.top + viewport.scrollY - tooltipRect.height - 8;
      let left = rect.left + viewport.scrollX + rect.width / 2 - tooltipRect.width / 2;
      let arrow = 'arrow-bottom';

      if (top < viewport.scrollY + 8) {
        top = rect.bottom + viewport.scrollY + 8;
        arrow = 'arrow-top';
      }

      if (left < 8) {
        left = 8;
      }
      if (left + tooltipRect.width > viewport.innerWidth - 8) {
        left = viewport.innerWidth - tooltipRect.width - 8;
      }

      return { top, left, arrow };
    }

    // Normal placement above element
    const normal = computeTooltipPosition(
      { top: 200, bottom: 220, left: 100, width: 80 },
      { width: 160, height: 60 },
      { scrollY: 0, scrollX: 0, innerWidth: 1000 }
    );
    expect(normal.top).toBe(200 - 60 - 8);
    expect(normal.arrow).toBe('arrow-bottom');
    expect(normal.left).toBe(100 + 40 - 80);

    // Near top edge of viewport flips arrow to top
    const nearTop = computeTooltipPosition(
      { top: 20, bottom: 40, left: 100, width: 80 },
      { width: 160, height: 60 },
      { scrollY: 0, scrollX: 0, innerWidth: 1000 }
    );
    expect(nearTop.top).toBe(40 + 8);
    expect(nearTop.arrow).toBe('arrow-top');

    // Clipping on left boundary clamps to 8px
    const clippedLeft = computeTooltipPosition(
      { top: 200, bottom: 220, left: 10, width: 20 },
      { width: 160, height: 60 },
      { scrollY: 0, scrollX: 0, innerWidth: 1000 }
    );
    expect(clippedLeft.left).toBe(8);

    // Clipping on right boundary clamps to innerWidth - width - 8
    const clippedRight = computeTooltipPosition(
      { top: 200, bottom: 220, left: 950, width: 40 },
      { width: 160, height: 60 },
      { scrollY: 0, scrollX: 0, innerWidth: 1000 }
    );
    expect(clippedRight.left).toBe(1000 - 160 - 8);
  });
});
