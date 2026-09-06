import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import {
  computeAnchorId,
  normalizeAnchorText,
  parseMarkdownAnchors,
  findBlockByHash,
} from '../../shared/anchor.js';
import { fuzzyMatch } from '../../shared/placement.js';

test.describe('Anchoring: Content Hashing and Fuzzy Relocation', () => {
  test('FEAT-ANCH-HASH & FEAT-ANCH-RELOCATE: Deterministic anchor calculation and relocation', async () => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-HASH');
    allure.story('Deterministic Paragraph Hashing & Fuzzy Relocation');

    const originalParagraph =
      'Paragraph one provides baseline text for verifying deterministic content-based SHA-256 anchoring.';
    let anchorId = '';

    await test.step('1. Calculate deterministic anchor ID for original paragraph', async () => {
      const normalized = normalizeAnchorText(originalParagraph);
      expect(normalized.length).toBeGreaterThan(0);
      anchorId = computeAnchorId(originalParagraph, 0);
      expect(anchorId).toMatch(/^a_0_[a-f0-9]{8}$/);
    });

    await test.step('2. Relocate anchor by exact text in extracted document blocks', async () => {
      const fullDoc = `# Title\n\n${originalParagraph}\n\nAnother block.`;
      const blocks = parseMarkdownAnchors(fullDoc);
      const hash = anchorId.split('_')[2];
      const match = findBlockByHash(blocks, hash);
      expect(match).toBeDefined();
      expect(match?.anchor_text).toBe(originalParagraph);
    });

    await test.step('3. Relocate anchor for selection-based highlighting (fuzzy matching)', async () => {
      const selectedSnippet = 'Paragraph one provides baseline text';
      const isFuzzyMatched = fuzzyMatch(selectedSnippet, originalParagraph);
      expect(isFuzzyMatched).toBe(true);
    });

    await test.step('4. Mark anchor as orphan when paragraph is deleted or mismatched', async () => {
      const completelyDifferent = 'Completely different content with no trace.';
      const isFuzzyMatched = fuzzyMatch(originalParagraph, completelyDifferent);
      expect(isFuzzyMatched).toBe(false);
    });
  });
});
