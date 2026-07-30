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

  it('handles negative matches', () => {
    expect(fuzzyMatch('hello', 'world')).toBe(false);
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
});
