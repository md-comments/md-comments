import type { AnchorBlock, InlineComment, PlacementResult } from './types';
import { normalizeAnchorText } from './anchor';

export function fuzzyMatch(anchorText: string, blockText: string): boolean {
  const a = normalizeAnchorText(anchorText).toLowerCase();
  const b = normalizeAnchorText(blockText).toLowerCase();
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  // Selection-based anchor_text is usually a substring of the paragraph.
  if (b.includes(a)) {
    return true;
  }
  if (a.length >= 12 && a.includes(b)) {
    return true;
  }
  return false;
}

/**
 * Placement cascade: paragraph hash → fuzzy text → heading+index → unplaced.
 * Multiple inline comments may share the same paragraph.
 */
export function placeInlineComments(
  blocks: AnchorBlock[],
  comments: InlineComment[]
): PlacementResult[] {
  const byHash = new Map(blocks.map((b) => [b.anchor_hash, b]));
  const byIndex = new Map(blocks.map((b) => [b.paragraph_index, b]));

  return comments.map((comment) => {
    const hashBlock = byHash.get(comment.anchor_hash);
    if (hashBlock) {
      return {
        comment,
        placed: true,
        paragraphIndex: hashBlock.paragraph_index,
      };
    }

    const fuzzyBlock = blocks.find((b) => fuzzyMatch(comment.anchor_text, b.anchor_text));
    if (fuzzyBlock) {
      return {
        comment,
        placed: true,
        paragraphIndex: fuzzyBlock.paragraph_index,
      };
    }

    const indexBlock = byIndex.get(comment.paragraph_index);
    if (indexBlock && indexBlock.heading_context === comment.heading_context) {
      return {
        comment,
        placed: true,
        paragraphIndex: indexBlock.paragraph_index,
      };
    }

    return {
      comment,
      placed: false,
      paragraphIndex: null,
    };
  });
}

/** True when a comment cannot be reliably anchored to current document text. */
export function isOrphanedPlacement(blocks: AnchorBlock[], placement: PlacementResult): boolean {
  if (placement.comment.orphaned) {
    return true;
  }
  if (!placement.placed) {
    return true;
  }
  const block = blocks.find((b) => b.paragraph_index === placement.paragraphIndex);
  if (!block) {
    return true;
  }
  return block.anchor_hash !== placement.comment.anchor_hash;
}

export function unplacedOrOrphan(
  blocks: AnchorBlock[],
  placements: PlacementResult[]
): PlacementResult[] {
  return placements.filter((p) => isOrphanedPlacement(blocks, p));
}
