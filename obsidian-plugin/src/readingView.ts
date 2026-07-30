import { App, MarkdownPostProcessorContext, TFile, Menu } from 'obsidian';
import { fnv1aHash, normalizeAnchorText } from '../../shared/anchor';
import { placeInlineComments } from '../../shared/placement';
import type { AnchorBlock, InlineComment, CommentsFile } from '../../shared/types';

const ICON_PARAGRAPH_COMMENT =
  '<svg class="md-comments-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9.5L6.5 17.5V6a1.5 1.5 0 0 1 1.5-1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 8h7.5M8.5 10.5h7.5M8.5 13h4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

function fuzzyMatch(anchorText: string, blockText: string): boolean {
  const a = normalizeAnchorText(anchorText).toLowerCase();
  const b = normalizeAnchorText(blockText).toLowerCase();
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  return b.includes(a) || (a.length >= 12 && a.includes(b));
}

function highlightTextInElement(el: HTMLElement, searchText: string, commentId: string) {
  if (!searchText) return;
  const normalizedSearch = searchText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalizedSearch) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Text;
  while ((node = walker.nextNode() as Text)) {
    const parent = node.parentNode as HTMLElement;
    if (
      parent &&
      (parent.classList.contains('md-comments-highlight') ||
        parent.className.includes('md-comments-highlight') ||
        parent.closest('.md-comments-para-actions') ||
        parent.closest('.md-comments-sidebar-container'))
    ) {
      continue;
    }
    textNodes.push(node);
  }

  let fullRawText = '';
  const textNodesWithOffsets = textNodes.map((n) => {
    const val = n.nodeValue || '';
    const start = fullRawText.length;
    fullRawText += val;
    const end = fullRawText.length;
    return { node: n, start, end };
  });

  const escaped = searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = escaped.replace(/\s+/g, '\\s+');
  let regex: RegExp;
  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    regex = new RegExp(pattern, 'gi');
  } catch (e) {
    return;
  }

  const matches: { start: number; end: number }[] = [];
  let match;
  while ((match = regex.exec(fullRawText)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  for (const nodeInfo of textNodesWithOffsets) {
    const { node: n, start: nodeStart, end: nodeEnd } = nodeInfo;
    const val = n.nodeValue || '';
    const overlaps = matches
      .filter((m) => Math.max(m.start, nodeStart) < Math.min(m.end, nodeEnd))
      .sort((a, b) => a.start - b.start);

    if (overlaps.length === 0) continue;

    const parent = n.parentNode;
    if (!parent) continue;

    const newNodes: Node[] = [];
    let lastIndex = 0;

    for (const overlap of overlaps) {
      const localStart = Math.max(0, overlap.start - nodeStart);
      const localEnd = Math.min(val.length, overlap.end - nodeStart);

      if (localStart > lastIndex) {
        newNodes.push(document.createTextNode(val.slice(lastIndex, localStart)));
      }

      const span = document.createElement('span');
      span.className = 'md-comments-highlight';
      span.dataset.commentId = commentId;
      span.textContent = val.slice(localStart, localEnd);
      newNodes.push(span);

      lastIndex = localEnd;
    }

    if (lastIndex < val.length) {
      newNodes.push(document.createTextNode(val.slice(lastIndex)));
    }

    for (const newNode of newNodes) {
      parent.insertBefore(newNode, n);
    }
    n.remove();
  }
}

export function registerReadingViewProcessor(
  app: App,
  getComments: (file: TFile) => Promise<CommentsFile>,
  getAnchorBlocks: (file: TFile) => Promise<AnchorBlock[]>,
  onAddComment: (file: TFile, block: AnchorBlock, selection?: string) => void,
  onOpenComment: (commentId: string) => void
) {
  return async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
    const file = app.vault.getAbstractFileByPath(context.sourcePath);
    if (!file || !(file instanceof TFile)) return;

    // We only process paragraphs
    const paragraphs =
      element.tagName === 'P' ? [element] : Array.from(element.querySelectorAll('p'));
    if (paragraphs.length === 0) return;

    const blocks = await getAnchorBlocks(file);
    const comments = await getComments(file);
    const inlineComments: InlineComment[] = comments.inline_comments || [];
    const placements = placeInlineComments(blocks, inlineComments);

    for (const p of paragraphs) {
      // Ignore if it's already processed or is part of a comment sidebar / custom UI
      if (
        p.classList.contains('md-comments-paragraph') ||
        p.closest('.md-comments-sidebar-container')
      ) {
        continue;
      }

      const pText = normalizeAnchorText(p.textContent || '');
      if (!pText) continue;

      const pHash = fnv1aHash(pText);

      // Find matching anchor block
      const block = blocks.find((b) => b.anchor_hash === pHash || fuzzyMatch(pText, b.anchor_text));
      if (!block) continue;

      p.classList.add('md-comments-paragraph');
      p.dataset.mdAnchorHash = block.anchor_hash;
      p.dataset.mdParagraphIndex = String(block.paragraph_index);

      // Apply highlights for comments placed on this paragraph
      const paragraphPlacements = placements.filter(
        (pl) => pl.placed && pl.paragraphIndex === block.paragraph_index && !pl.comment.resolved
      );

      for (const pl of paragraphPlacements) {
        highlightTextInElement(p, pl.comment.anchor_text, pl.comment.id);
      }

      // Add click listeners to active highlights
      p.querySelectorAll('.md-comments-highlight').forEach((hlNode) => {
        const hl = hlNode as HTMLElement;
        hl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const commentId = hl.dataset.commentId;
          if (commentId) {
            onOpenComment(commentId);
          }
        });
      });

      // Add hover paragraph comment button
      const btnSpan = document.createElement('span');
      btnSpan.className = 'md-comments-para-actions';
      btnSpan.innerHTML = `<button type="button" class="md-comments-icon-btn" title="Comment on paragraph">${ICON_PARAGRAPH_COMMENT}</button>`;

      btnSpan.querySelector('button')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onAddComment(file, block);
      });

      p.appendChild(btnSpan);

      // Add context menu listener for commenting on selection
      p.addEventListener('contextmenu', (e) => {
        const selection = window.getSelection();
        const selectedText = (selection?.toString() || '').trim();
        const isSelectionInP =
          selection && selection.anchorNode && p.contains(selection.anchorNode);

        if (selectedText && isSelectionInP) {
          e.preventDefault();
          e.stopPropagation();

          const menu = new Menu();
          menu.addItem((item) => {
            item
              .setTitle('Add Comment to Selection')
              .setIcon('message-square')
              .onClick(() => {
                onAddComment(file, block, selectedText);
              });
          });
          menu.addItem((item) => {
            item
              .setTitle('Comment on Paragraph')
              .setIcon('message-square')
              .onClick(() => {
                onAddComment(file, block);
              });
          });
          menu.addSeparator();
          menu.addItem((item) => {
            item
              .setTitle('Copy')
              .setIcon('copy')
              .onClick(() => {
                navigator.clipboard.writeText(selectedText);
              });
          });
          menu.showAtMouseEvent(e);
        }
      });
    }
  };
}
