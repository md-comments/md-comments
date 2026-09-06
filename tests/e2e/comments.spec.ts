import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { mergeCommentsFiles } from '../../shared/gitRefBackend.js';
import type { CommentsFile, InlineComment, PageComment } from '../../shared/types.js';

test.describe('Comments: Inline and Page Comment Lifecycles', () => {
  test('FEAT-COMM-INLINE & FEAT-COMM-PAGE: Creates, merges, and validates comments', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-INLINE');
    allure.story('Inline & Page Comment Creation');

    const inlineComment: InlineComment = {
      id: 'comm-inline-1',
      author: 'alice',
      body: 'This is an inline comment on paragraph 1.',
      created_at: new Date().toISOString(),
      anchor_hash: 'a_0_abcdef12',
      paragraph_index: 0,
      heading_context: 'Overview',
      anchor_text: 'Paragraph one baseline text',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    const pageComment: PageComment = {
      id: 'comm-page-1',
      author: 'bob',
      body: 'Overall document looks great!',
      created_at: new Date().toISOString(),
      resolved: false,
      reactions: [],
      replies: [],
    };

    const localFile: CommentsFile = {
      inline_comments: [inlineComment],
      page_comments: [pageComment],
    };

    await test.step('1. Validate inline and page comment schema', async () => {
      expect(localFile.inline_comments.length).toBe(1);
      expect(localFile.page_comments.length).toBe(1);
      expect(localFile.inline_comments[0].orphaned).toBe(false);
      expect(localFile.inline_comments[0].resolved).toBe(false);
    });

    await test.step('2. Merge concurrent incoming remote comments non-destructively', async () => {
      const remoteFile: CommentsFile = {
        inline_comments: [
          {
            id: 'comm-inline-2',
            author: 'carol',
            body: 'A concurrent comment from Carol',
            created_at: new Date().toISOString(),
            anchor_hash: 'a_1_fedcba34',
            paragraph_index: 1,
            heading_context: 'Overview',
            anchor_text: 'Paragraph two text',
            orphaned: false,
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
        page_comments: [],
      };

      const merged = mergeCommentsFiles(localFile, remoteFile);
      expect(merged.inline_comments.length).toBe(2);
      expect(merged.page_comments.length).toBe(1);
    });
  });
});
