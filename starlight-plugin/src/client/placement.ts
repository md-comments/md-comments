import { fuzzyMatch } from '@md-comments/shared';
import type { ScannedElement } from './domAnchors.js';

/**
 * Resolves the best matching DOM element for a given target anchor or text prefix.
 */
export function resolveElementForAnchor(
  scanned: ScannedElement[],
  anchorId: string,
  textPrefix: string,
  preferredIndex: number
): ScannedElement | null {
  // 1. Direct Anchor ID match
  const exact = scanned.find((s) => s.anchorId === anchorId);
  if (exact) return exact;

  // 2. Fuzzy text prefix matching
  if (textPrefix) {
    const fuzzy = scanned.find((s) => fuzzyMatch(textPrefix, s.textPrefix));
    if (fuzzy) return fuzzy;
  }

  // 3. Fallback by index
  const byIndex = scanned.find((s) => s.lineIndex === preferredIndex);
  if (byIndex) return byIndex;

  return null;
}
