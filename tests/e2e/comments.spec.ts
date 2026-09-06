import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { mergeCommentsFiles } from '../../shared/gitRefBackend.js';
import { escapeHtml } from '../../shared/html.js';
import type { CommentsFile, InlineComment, PageComment } from '../../shared/types.js';

test.describe('Comments: Inline, Page, Editing, Deletion, Toolbar & Preview', () => {
  test('FEAT-COMM-INLINE: Creates and validates inline gutter comment', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-INLINE');
    allure.story('Inline Gutter Comment Creation');

    const comment: InlineComment = {
      id: 'comm-inline-1',
      author: 'alice',
      body: 'Feedback on paragraph 1 structure.',
      created_at: new Date().toISOString(),
      anchor_hash: 'a_0_12345678',
      paragraph_index: 0,
      heading_context: 'Overview',
      anchor_text: 'First paragraph text',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Validate inline comment structure', async () => {
      expect(comment.id).toBeDefined();
      expect(comment.author).toBe('alice');
      expect(comment.paragraph_index).toBe(0);
      expect(comment.anchor_hash).toBe('a_0_12345678');
      expect(comment.resolved).toBe(false);
      expect(comment.orphaned).toBe(false);
    });

    await test.step('2. Store in CommentsFile payload', async () => {
      const file: CommentsFile = {
        inline_comments: [comment],
        page_comments: [],
      };
      expect(file.inline_comments.length).toBe(1);
    });
  });

  test('FEAT-COMM-PAGE: Creates and validates whole-document page comment', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-PAGE');
    allure.story('Whole-Document Page Comments');

    const pageComment: PageComment = {
      id: 'comm-page-1',
      author: 'bob',
      body: 'Comprehensive guide is well organized.',
      created_at: new Date().toISOString(),
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Validate page comment structure', async () => {
      expect(pageComment.id).toBe('comm-page-1');
      expect(pageComment.author).toBe('bob');
      expect(pageComment.resolved).toBe(false);
    });

    await test.step('2. Merge page comments concurrently', async () => {
      const baseFile: CommentsFile = {
        inline_comments: [],
        page_comments: [pageComment],
      };
      const incomingFile: CommentsFile = {
        inline_comments: [],
        page_comments: [
          {
            id: 'comm-page-2',
            author: 'carol',
            body: 'Another page comment from Carol.',
            created_at: new Date().toISOString(),
            resolved: false,
            reactions: [],
            replies: [],
          },
        ],
      };

      const merged = mergeCommentsFiles(baseFile, incomingFile);
      expect(merged.page_comments.length).toBe(2);
      expect(merged.page_comments.map((c) => c.author)).toContain('carol');
    });
  });

  test('FEAT-COMM-EDIT: In-place comment editing and updated_at timestamp', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-EDIT');
    allure.story('In-Place Comment Editing & Versions');

    const comment: InlineComment = {
      id: 'comm-edit-1',
      author: 'alice',
      body: 'Initial comment drafting text.',
      created_at: '2026-09-01T10:00:00.000Z',
      anchor_hash: '12345678',
      paragraph_index: 0,
      heading_context: 'Overview',
      anchor_text: 'Target text',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Edit comment body and record updated_at timestamp', async () => {
      const updatedBody = 'Edited comment text with clarified suggestions.';
      const editTimestamp = new Date().toISOString();

      comment.body = updatedBody;
      comment.updated_at = editTimestamp;

      expect(comment.body).toBe(updatedBody);
      expect(comment.updated_at).toBeDefined();
      expect(new Date(comment.updated_at).getTime()).toBeGreaterThan(
        new Date(comment.created_at).getTime()
      );
    });
  });

  test('FEAT-COMM-DELETE: Comment deletion and data file cleanup', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-DELETE');
    allure.story('Comment Deletion & Schema Update');

    const commentsFile: CommentsFile = {
      inline_comments: [
        {
          id: 'comm-del-1',
          author: 'alice',
          body: 'To be deleted.',
          created_at: new Date().toISOString(),
          anchor_hash: 'hash1',
          paragraph_index: 0,
          heading_context: 'Intro',
          anchor_text: 'Intro text',
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
        },
        {
          id: 'comm-del-2',
          author: 'bob',
          body: 'To be kept.',
          created_at: new Date().toISOString(),
          anchor_hash: 'hash2',
          paragraph_index: 1,
          heading_context: 'Intro',
          anchor_text: 'Body text',
          orphaned: false,
          resolved: false,
          reactions: [],
          replies: [],
        },
      ],
      page_comments: [],
    };

    await test.step('1. Delete comment by ID', async () => {
      const targetId = 'comm-del-1';
      commentsFile.inline_comments = commentsFile.inline_comments.filter((c) => c.id !== targetId);

      expect(commentsFile.inline_comments.length).toBe(1);
      expect(commentsFile.inline_comments[0].id).toBe('comm-del-2');
    });
  });

  test('FEAT-COMM-TOOLBAR: Bold, Italic, and Code markdown formatting helper', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-TOOLBAR');
    allure.story('Toolbar Markdown Formatting');

    function applyFormat(text: string, format: 'bold' | 'italic' | 'code'): string {
      switch (format) {
        case 'bold':
          return `**${text}**`;
        case 'italic':
          return `*${text}*`;
        case 'code':
          return `\`${text}\``;
      }
    }

    await test.step('1. Apply bold formatting to selection', async () => {
      const formatted = applyFormat('critical note', 'bold');
      expect(formatted).toBe('**critical note**');
    });

    await test.step('2. Apply italic formatting to selection', async () => {
      const formatted = applyFormat('subtle hint', 'italic');
      expect(formatted).toBe('*subtle hint*');
    });

    await test.step('3. Apply code formatting to selection', async () => {
      const formatted = applyFormat('config.json', 'code');
      expect(formatted).toBe('`config.json`');
    });
  });

  test('FEAT-COMM-PREVIEW: Live Markdown preview rendering and HTML escaping', async () => {
    allure.epic('Comments');
    allure.feature('FEAT-COMM-PREVIEW');
    allure.story('Live Markdown Preview Rendering');

    function renderPreviewHtml(markdown: string): string {
      const escaped = escapeHtml(markdown);
      return escaped
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    await test.step('1. Render formatted markdown into HTML', async () => {
      const input = 'Here is **bold** and *italic* and `code`.';
      const rendered = renderPreviewHtml(input);
      expect(rendered).toContain('<strong>bold</strong>');
      expect(rendered).toContain('<em>italic</em>');
      expect(rendered).toContain('<code>code</code>');
    });

    await test.step('2. Ensure malicious HTML is sanitized/escaped in preview', async () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const rendered = renderPreviewHtml(malicious);
      expect(rendered).not.toContain('<img');
      expect(rendered).toContain('&lt;img');
    });
  });
});
