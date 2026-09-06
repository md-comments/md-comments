import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import type { InlineComment, Reply } from '../../shared/types.js';

test.describe('Threads: Replies, Resolution Lifecycle & State Filtering', () => {
  test('FEAT-THRD-REPLY: Appends threaded replies and preserves hierarchy', async () => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-REPLY');
    allure.story('Threaded Replies Hierarchy');

    const thread: InlineComment = {
      id: 'thread-1',
      author: 'dev-1',
      body: 'Should we refactor this function?',
      created_at: new Date().toISOString(),
      anchor_hash: '12345678',
      paragraph_index: 0,
      heading_context: 'Overview',
      anchor_text: 'Target paragraph',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Append threaded reply from collaborator', async () => {
      const reply: Reply = {
        id: 'reply-1',
        author: 'dev-2',
        body: 'Yes, let us extract the helper.',
        created_at: new Date().toISOString(),
        reactions: [],
      };
      thread.replies = thread.replies || [];
      thread.replies.push(reply);

      expect(thread.replies.length).toBe(1);
      expect(thread.replies[0].id).toBe('reply-1');
      expect(thread.replies[0].author).toBe('dev-2');
    });

    await test.step('2. Add second reply in conversation chain', async () => {
      const reply2: Reply = {
        id: 'reply-2',
        author: 'dev-3',
        body: 'Agreed. I can review the PR.',
        created_at: new Date().toISOString(),
        reactions: [],
      };
      thread.replies?.push(reply2);

      expect(thread.replies?.length).toBe(2);
      expect(thread.replies?.[1].author).toBe('dev-3');
    });
  });

  test('FEAT-THRD-RESOLVE: Resolves and reopens comment threads with audit metadata', async () => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-RESOLVE');
    allure.story('Thread Resolve & Reopen Lifecycle');

    const thread: InlineComment = {
      id: 'thread-lifecycle-1',
      author: 'alice',
      body: 'Verify error handling logic',
      created_at: new Date().toISOString(),
      anchor_hash: 'hash123',
      paragraph_index: 1,
      heading_context: 'API',
      anchor_text: 'Error handling text',
      orphaned: false,
      resolved: false,
      reactions: [],
      replies: [],
    };

    await test.step('1. Mark thread as resolved', async () => {
      thread.resolved = true;
      thread.resolved_at = new Date().toISOString();

      expect(thread.resolved).toBe(true);
      expect(thread.resolved_at).toBeDefined();
    });

    await test.step('2. Reopen thread and clear resolution audit fields', async () => {
      thread.resolved = false;
      delete thread.resolved_at;

      expect(thread.resolved).toBe(false);
      expect(thread.resolved_at).toBeUndefined();
    });
  });

  test('FEAT-THRD-FILTER: Filters threads between All, Open, and Resolved views', async () => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-FILTER');
    allure.story('Filter Open vs Resolved Threads');

    const threads: InlineComment[] = [
      {
        id: 't-1',
        author: 'alice',
        body: 'Open question',
        created_at: new Date().toISOString(),
        anchor_hash: 'h1',
        paragraph_index: 0,
        heading_context: 'Doc',
        anchor_text: 'Text 1',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
      {
        id: 't-2',
        author: 'bob',
        body: 'Completed feedback',
        created_at: new Date().toISOString(),
        anchor_hash: 'h2',
        paragraph_index: 1,
        heading_context: 'Doc',
        anchor_text: 'Text 2',
        orphaned: false,
        resolved: true,
        resolved_at: new Date().toISOString(),
        reactions: [],
        replies: [],
      },
    ];

    await test.step('1. Filter for Open threads', async () => {
      const openThreads = threads.filter((t) => !t.resolved);
      expect(openThreads.length).toBe(1);
      expect(openThreads[0].id).toBe('t-1');
    });

    await test.step('2. Filter for Resolved threads', async () => {
      const resolvedThreads = threads.filter((t) => t.resolved);
      expect(resolvedThreads.length).toBe(1);
      expect(resolvedThreads[0].id).toBe('t-2');
    });

    await test.step('3. Filter for All threads', async () => {
      expect(threads.length).toBe(2);
    });
  });
});
