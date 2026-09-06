import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { computeAnchorId, normalizeAnchorText, parseMarkdownAnchors } from '../../shared/anchor.js';
import { fuzzyMatch, placeInlineComments, isOrphanedPlacement } from '../../shared/placement.js';
import type { InlineComment } from '../../shared/types.js';

test.describe('Anchoring: Content Hashing, Relocation, Orphans & Complex Blocks', () => {
  test('FEAT-ANCH-HASH: Deterministic content-based SHA-256 anchor hashing', async () => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-HASH');
    allure.story('Deterministic Paragraph Hashing');

    const paragraphText =
      'This is an anchor target paragraph testing deterministic hashing across markdown blocks.';

    await test.step('1. Normalize text and calculate anchor ID', async () => {
      const normalized = normalizeAnchorText(paragraphText);
      expect(normalized).toBe(paragraphText);
      const anchorId = computeAnchorId(paragraphText, 0);
      expect(anchorId).toMatch(/^a_0_[a-f0-9]{8}$/);
    });

    await test.step('2. Verify hash idempotence regardless of extra whitespace', async () => {
      const withWhitespace =
        '   This  is an anchor target paragraph testing deterministic hashing across markdown blocks.   \n';
      const id1 = computeAnchorId(paragraphText, 0);
      const id2 = computeAnchorId(withWhitespace, 0);
      expect(id1).toBe(id2);
    });
  });

  test('FEAT-ANCH-RELOCATE: Fuzzy anchor relocation when paragraph is edited', async () => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-RELOCATE');
    allure.story('Fuzzy Anchor Relocation');

    const selectionText = 'inline discussions directly on GitHub';
    const fullParagraph =
      'Markdown Comments provides inline discussions directly on GitHub markdown documentation.';

    await test.step('1. Fuzzy match selection substring against full paragraph', async () => {
      const isMatched = fuzzyMatch(selectionText, fullParagraph);
      expect(isMatched).toBe(true);
    });

    await test.step('2. Relocate anchor to target paragraph block in document', async () => {
      const doc = `# Introduction\n\n${fullParagraph}\n\nConclusion paragraph.`;
      const blocks = parseMarkdownAnchors(doc);
      expect(blocks.length).toBeGreaterThanOrEqual(2);

      const targetBlock = blocks.find((b) => fuzzyMatch(selectionText, b.anchor_text));
      expect(targetBlock).toBeDefined();
      expect(targetBlock?.anchor_text).toBe(fullParagraph);
    });
  });

  test('FEAT-ANCH-ORPHAN: Identifies deleted content and routes to Orphan Comment Tray', async () => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-ORPHAN');
    allure.story('Orphan Comment Tray & Manual Re-anchoring');

    const deletedText = 'This paragraph was completely deleted in the latest git revision.';
    const newDoc = '# Introduction\n\nA completely different paragraph with zero overlap.\n';
    const blocks = parseMarkdownAnchors(newDoc);

    const comment: InlineComment = {
      id: 'comm-orphan-1',
      author: 'alice',
      body: 'Important question on deleted paragraph',
      created_at: new Date().toISOString(),
      anchor_hash: 'abcdef12',
      paragraph_index: 0,
      heading_context: 'Introduction',
      anchor_text: deletedText,
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Detect orphan status when target paragraph no longer exists', async () => {
      const placed = placeInlineComments(blocks, [comment]);
      expect(placed.length).toBe(1);
      expect(isOrphanedPlacement(blocks, placed[0])).toBe(true);
    });

    await test.step('2. Re-anchor orphaned comment to new target block', async () => {
      const targetBlock = blocks[1]; // Paragraph block after heading
      const reanchoredComment: InlineComment = {
        ...comment,
        anchor_hash: targetBlock.anchor_hash,
        paragraph_index: targetBlock.paragraph_index,
        heading_context: targetBlock.heading_context,
        anchor_text: targetBlock.anchor_text,
        orphaned: false,
      };

      const replaced = placeInlineComments(blocks, [reanchoredComment]);
      expect(replaced.length).toBe(1);
      expect(isOrphanedPlacement(blocks, replaced[0])).toBe(false);
    });
  });

  test('FEAT-ANCH-COMPLEX: Anchors across markdown tables, code fences, and blockquotes', async () => {
    allure.epic('Anchoring');
    allure.feature('FEAT-ANCH-COMPLEX');
    allure.story('Complex Block Anchoring');

    const complexMarkdown = `
# System Architecture

> Important architectural constraint: Zero PATs allowed in browser storage.

\`\`\`typescript
export function runHarness(): boolean {
  return true;
}
\`\`\`

| Component | Status | Latency |
| --- | --- | --- |
| Extension | Active | <10ms |
| Mock API | Active | <5ms |
`;

    await test.step('1. Parse markdown document with blockquotes, fences, and tables', async () => {
      const blocks = parseMarkdownAnchors(complexMarkdown);
      expect(blocks.length).toBeGreaterThanOrEqual(3);

      const blockquote = blocks.find((b) => b.anchor_text.includes('Zero PATs allowed'));
      expect(blockquote).toBeDefined();
      expect(blockquote?.heading_context).toBe('System Architecture');

      const tableBlock = blocks.find((b) => b.anchor_text.includes('Extension'));
      expect(tableBlock).toBeDefined();
    });

    await test.step('2. Calculate deterministic anchor hashes for each complex block', async () => {
      const blocks = parseMarkdownAnchors(complexMarkdown);
      for (const block of blocks) {
        expect(block.anchor_hash).toMatch(/^[a-f0-9]{8}$/);
        expect(block.paragraph_index).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
