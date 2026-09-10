import { describe, it, expect } from 'vitest';
import { fuzzyMatch, placeInlineComments, isOrphanedPlacement } from '../shared/placement';
import type { AnchorBlock, InlineComment } from '../shared/types';

describe('fuzzyMatch', () => {
  it('identifies exact matches', () => {
    expect(fuzzyMatch('exact matches', 'exact matches')).toBe(true);
  });

  it('identifies substring matches', () => {
    expect(fuzzyMatch('brown fox', 'The quick brown fox jumps')).toBe(true);
  });

  it('handles negative matches and empty strings', () => {
    expect(fuzzyMatch('hello', 'world')).toBe(false);
    expect(fuzzyMatch('', 'world')).toBe(false);
    expect(fuzzyMatch('hello', '')).toBe(false);
  });
});

describe('placeInlineComments', () => {
  const blocks: AnchorBlock[] = [
    {
      paragraph_index: 0,
      heading_context: 'Heading 1',
      anchor_hash: '9f82d1c6',
      anchor_text: 'The primary paragraph for comments.',
    },
  ];

  it('places a comment correctly using precise hash match', () => {
    const comment: InlineComment = {
      id: 'c1',
      author: 'alice',
      anchor_text: 'The primary paragraph for comments.',
      anchor_hash: '9f82d1c6',
      paragraph_index: 0,
      heading_context: 'Heading 1',
      body: 'Important discussion',
      created_at: '',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    expect(placements[0].paragraphIndex).toBe(0);
  });

  it('resolves shifted comments using fuzzy matching', () => {
    const comment: InlineComment = {
      id: 'c2',
      author: 'bob',
      anchor_text: 'primary paragraph',
      anchor_hash: 'wrong-hash', // hash changed (e.g. text slightly edited)
      paragraph_index: 99, // position shifted
      heading_context: 'Heading 1',
      body: 'Fuzzy match comment',
      created_at: '',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    expect(placements[0].paragraphIndex).toBe(0); // fuzzy matched back to correct index
  });

  it('matches when anchorText length >= 12 and contains blockText', () => {
    expect(fuzzyMatch('this is a very long anchor text', 'long anchor')).toBe(true);
  });

  it('places comment by paragraph index and matching heading context when hash and fuzzy fail', () => {
    const comment: InlineComment = {
      id: 'c3',
      author: 'alice',
      anchor_text: 'completely different text',
      anchor_hash: 'unmatched-hash',
      paragraph_index: 0,
      heading_context: 'Heading 1',
      body: 'Placed by index and heading',
      created_at: '',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    expect(placements[0].paragraphIndex).toBe(0);
  });

  it('returns unplaced result when all placement strategies fail', () => {
    const comment: InlineComment = {
      id: 'c4',
      author: 'alice',
      anchor_text: 'unmatched text',
      anchor_hash: 'unmatched-hash',
      paragraph_index: 55,
      heading_context: 'Different Heading',
      body: 'Cannot be placed',
      created_at: '',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(blocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(false);
    expect(placements[0].paragraphIndex).toBeNull();
  });
});

describe('isOrphanedPlacement', () => {
  const blocks: AnchorBlock[] = [
    {
      paragraph_index: 0,
      heading_context: 'Heading 1',
      anchor_hash: '9f82d1c6',
      anchor_text: 'The primary paragraph for comments.',
    },
  ];

  it('detects a comment as orphaned if it is marked as orphaned', () => {
    const placement = {
      comment: {
        id: 'c1',
        author: 'alice',
        anchor_text: '',
        anchor_hash: '',
        paragraph_index: 0,
        heading_context: '',
        body: '',
        created_at: '',
        orphaned: true,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: true,
      paragraphIndex: 0,
    };
    expect(isOrphanedPlacement(blocks, placement)).toBe(true);
  });

  it('detects a comment as orphaned if the hash under resolved paragraph changed', () => {
    const placement = {
      comment: {
        id: 'c1',
        author: 'alice',
        anchor_text: 'Original paragraph text',
        anchor_hash: 'different-hash',
        paragraph_index: 0,
        heading_context: 'Heading 1',
        body: '',
        created_at: '',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: true,
      paragraphIndex: 0,
    };
    expect(isOrphanedPlacement(blocks, placement)).toBe(true);
  });

  it('detects a comment as orphaned if placed is false', () => {
    const placement = {
      comment: {
        id: 'c2',
        author: 'alice',
        anchor_text: 'Text',
        anchor_hash: '9f82d1c6',
        paragraph_index: 0,
        heading_context: '',
        body: '',
        created_at: '',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: false,
      paragraphIndex: 0,
    };
    expect(isOrphanedPlacement(blocks, placement)).toBe(true);
  });

  it('detects a comment as orphaned if block is not found at paragraphIndex', () => {
    const placement = {
      comment: {
        id: 'c3',
        author: 'alice',
        anchor_text: 'Text',
        anchor_hash: '9f82d1c6',
        paragraph_index: 999,
        heading_context: '',
        body: '',
        created_at: '',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: true,
      paragraphIndex: 999,
    };
    expect(isOrphanedPlacement(blocks, placement)).toBe(true);
  });
});

describe('unplacedOrOrphan', () => {
  it('filters out valid placed comments and retains orphaned comments', async () => {
    const { unplacedOrOrphan } = await import('../shared/placement');
    const blocks = [
      {
        paragraph_index: 0,
        heading_context: 'H1',
        anchor_hash: 'valid-hash',
        anchor_text: 'valid text',
      },
    ];

    const validPlacement = {
      comment: {
        id: 'v1',
        author: 'alice',
        anchor_text: 'valid text',
        anchor_hash: 'valid-hash',
        paragraph_index: 0,
        heading_context: 'H1',
        body: 'ok',
        created_at: '',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: true,
      paragraphIndex: 0,
    };

    const orphanPlacement = {
      comment: {
        id: 'o1',
        author: 'bob',
        anchor_text: 'lost text',
        anchor_hash: 'lost-hash',
        paragraph_index: 0,
        heading_context: 'H1',
        body: 'lost',
        created_at: '',
        orphaned: true,
        resolved: false,
        reactions: [],
        replies: [],
      },
      placed: false,
      paragraphIndex: 0,
    };

    const result = unplacedOrOrphan(blocks, [validPlacement, orphanPlacement]);
    expect(result).toHaveLength(1);
    expect(result[0].comment.id).toBe('o1');
  });

  it('places inline comment on a frontmatter field selection without marking it as orphaned', async () => {
    const { parseMarkdownAnchors } = await import('../shared/anchor');
    const md = `---
title: "Document Title with Key Concept"
author: Alice
---

Body prose here.`;

    const parsedBlocks = parseMarkdownAnchors(md);
    expect(parsedBlocks[0].heading_context).toBe('Frontmatter');
    expect(parsedBlocks[0].anchor_text).toBe('title Document Title with Key Concept');

    const comment = {
      id: 'c-fm-1',
      author: 'bob',
      anchor_text: 'Key Concept',
      anchor_hash: parsedBlocks[0].anchor_hash,
      paragraph_index: 0,
      heading_context: 'Frontmatter',
      body: 'Comment on frontmatter title selection',
      created_at: new Date().toISOString(),
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const placements = placeInlineComments(parsedBlocks, [comment]);
    expect(placements).toHaveLength(1);
    expect(placements[0].placed).toBe(true);
    expect(placements[0].paragraphIndex).toBe(0);

    const isOrphan = isOrphanedPlacement(parsedBlocks, placements[0]);
    expect(isOrphan).toBe(false);
  });
});
