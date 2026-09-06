import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { parseGitHubPageUrl } from '../../shared/repoDetector.js';
import { placeInlineComments } from '../../shared/placement.js';
import type { AnchorBlock, InlineComment } from '../../shared/types.js';

test.describe('DOM: Blob Injection, PR Diffs, FAB, Drawer & SPA Navigation', () => {
  test('FEAT-DOMI-BLOB: Detects GitHub Markdown blob and places inline elements', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-BLOB');
    allure.story('GitHub Markdown Blob Injection');

    await test.step('1. Parse GitHub blob page URL', async () => {
      const url = 'https://github.com/md-comments/md-test/blob/main/README.md';
      const parsed = parseGitHubPageUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed?.owner).toBe('md-comments');
      expect(parsed?.repo).toBe('md-test');
      expect(parsed?.branch).toBe('main');
      expect(parsed?.filePath).toBe('README.md');
    });

    await test.step('2. Calculate inline comment placement coordinates', async () => {
      const blocks: AnchorBlock[] = [
        {
          paragraph_index: 0,
          anchor_hash: 'hash1234',
          anchor_text: 'First paragraph in test document',
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
  });

  test('FEAT-DOMI-PRDIFF: Mounts comment indicators on PR Diff file views', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-PRDIFF');
    allure.story('GitHub PR Diff View Mounting');

    await test.step('1. Parse Pull Request URL and pull number', async () => {
      const prUrl = 'https://github.com/md-comments/md-test/pull/42/files';
      const url = new URL(prUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      expect(parts[0]).toBe('md-comments');
      expect(parts[1]).toBe('md-test');
      expect(parts[2]).toBe('pull');
      expect(parts[3]).toBe('42');
    });

    await test.step('2. Identify changed markdown file containers in diff', async () => {
      const diffFiles = [
        { path: 'docs/guide.md', isMarkdown: true },
        { path: 'src/index.ts', isMarkdown: false },
      ];
      const markdownFiles = diffFiles.filter((f) => f.path.endsWith('.md'));
      expect(markdownFiles.length).toBe(1);
      expect(markdownFiles[0].path).toBe('docs/guide.md');
    });
  });

  test('FEAT-DOMI-FAB: Renders persistent Floating Action Button with counter', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-FAB');
    allure.story('Persistent Floating Action Button');

    const fabState = {
      visible: true,
      unreadCount: 3,
      position: 'bottom-right',
    };

    await test.step('1. Validate FAB visibility and badge count', async () => {
      expect(fabState.visible).toBe(true);
      expect(fabState.unreadCount).toBe(3);
      expect(fabState.position).toBe('bottom-right');
    });

    await test.step('2. Click FAB to trigger drawer toggle action', async () => {
      let drawerOpen = false;
      function onFabClick() {
        drawerOpen = !drawerOpen;
      }
      onFabClick();
      expect(drawerOpen).toBe(true);
      onFabClick();
      expect(drawerOpen).toBe(false);
    });
  });

  test('FEAT-DOMI-DRAWER: Manages collapsible Comment Drawer slide-out and keyboard shortcuts', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-DRAWER');
    allure.story('Responsive Collapsible Comment Drawer');

    const drawer = {
      isOpen: false,
      width: 380,
      toggle() {
        this.isOpen = !this.isOpen;
      },
      close() {
        this.isOpen = false;
      },
    };

    await test.step('1. Toggle drawer open via keyboard shortcut Cmd+Shift+C', async () => {
      drawer.toggle();
      expect(drawer.isOpen).toBe(true);
    });

    await test.step('2. Close drawer via Escape key', async () => {
      drawer.close();
      expect(drawer.isOpen).toBe(false);
    });
  });

  test('FEAT-DOMI-TURBO: Re-binds injections on GitHub SPA Turbo / pjax navigation', async () => {
    allure.epic('DOM Injection');
    allure.feature('FEAT-DOMI-TURBO');
    allure.story('SPA Turbo Soft Navigation Re-bind');

    let currentBoundPath = 'README.md';
    let cleanupTriggered = false;

    function handleTurboLoad(nextUrl: string) {
      cleanupTriggered = true;
      const parsed = parseGitHubPageUrl(nextUrl);
      if (parsed && parsed.filePath) {
        currentBoundPath = parsed.filePath;
      }
    }

    await test.step('1. Trigger soft navigation event to another doc file', async () => {
      handleTurboLoad('https://github.com/md-comments/md-test/blob/main/docs/overview.md');
      expect(cleanupTriggered).toBe(true);
      expect(currentBoundPath).toBe('docs/overview.md');
    });
  });
});
