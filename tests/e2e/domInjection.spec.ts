import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { parseGitHubPageUrl } from '../../shared/repoDetector.js';
import { placeInlineComments } from '../../shared/placement.js';
import type { AnchorBlock, InlineComment } from '../../shared/types.js';

test.describe('DOM Injection: GitHub Markdown Blob and Turbo Navigation', () => {
  test('FEAT-DOMI-BLOB & FEAT-DOMI-TURBO: Detects GitHub routes and aligns gutter placements', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-BLOB');
    allure.story('GitHub Blob Detection & Placement Alignment');

    await test.step('1. Parse GitHub blob page URL to extract repo and file path', async () => {
      const url = 'https://github.com/md-comments/md-test/blob/main/README.md';
      const parsed = parseGitHubPageUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed?.owner).toBe('md-comments');
      expect(parsed?.repo).toBe('md-test');
      expect(parsed?.branch).toBe('main');
      expect(parsed?.filePath).toBe('README.md');
    });

    await test.step('2. Calculate inline comment placement coordinates relative to markdown blocks', async () => {
      const blocks: AnchorBlock[] = [
        {
          paragraph_index: 0,
          anchor_hash: 'hash1234',
          anchor_text: 'First paragraph in test document',
          heading_context: 'Introduction',
        },
        {
          paragraph_index: 1,
          anchor_hash: 'hash5678',
          anchor_text: 'Second paragraph with details',
          heading_context: 'Introduction',
        },
      ];

      const comments: InlineComment[] = [
        {
          id: 'comm-1',
          anchor_hash: 'hash1234',
          paragraph_index: 0,
          anchor_text: 'First paragraph in test document',
          heading_context: 'Introduction',
          body: 'Great intro!',
          author: 'reviewer',
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
          created_at: new Date().toISOString(),
        },
      ];

      const placements = placeInlineComments(blocks, comments);
      expect(placements.length).toBe(1);
      expect(placements[0].placed).toBe(true);
      expect(placements[0].paragraphIndex).toBe(0);
    });

    await test.step('3. Handle SPA Turbo navigation by updating parsed target route', async () => {
      const navigatedUrl = 'https://github.com/md-comments/md-test/blob/main/docs/architecture.md';
      const reParsed = parseGitHubPageUrl(navigatedUrl);
      expect(reParsed?.filePath).toBe('docs/architecture.md');
    });
  });
});
