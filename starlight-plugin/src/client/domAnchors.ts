import { computeAnchorId } from '@md-comments/shared';

export interface ScannedElement {
  element: HTMLElement;
  anchorId: string;
  lineIndex: number;
  textPrefix: string;
  tag: string;
}

/**
 * Scans article DOM container for Markdown block elements (p, h1-h6, li, blockquote, pre)
 * and attaches deterministic anchor IDs.
 */
export function scanArticleAnchors(container: HTMLElement): ScannedElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre'
  );

  const scanned: ScannedElement[] = [];
  elements.forEach((el, index) => {
    // Avoid scanning internal UI overlays
    if (el.closest('.md-comments-overlay, .md-comments-drawer, .md-comments-auth-modal')) {
      return;
    }

    const text = el.innerText || el.textContent || '';
    const textPrefix = text.trim().slice(0, 40);
    const anchorId = computeAnchorId(textPrefix, index);

    el.setAttribute('data-md-anchor-id', anchorId);
    el.setAttribute('data-md-line-index', String(index));

    scanned.push({
      element: el,
      anchorId,
      lineIndex: index,
      textPrefix,
      tag: el.tagName.toLowerCase(),
    });
  });

  return scanned;
}
