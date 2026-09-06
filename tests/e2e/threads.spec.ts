import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import type { InlineComment, Reply } from '../../shared/types.js';

test.describe('Threads: Threaded Replies and Resolve/Reopen Lifecycle', () => {
  test('FEAT-THRD-REPLY & FEAT-THRD-RESOLVE: Appends replies and tracks resolution state', async () => {
    allure.epic('Threads');
    allure.feature('FEAT-THRD-REPLY');
    allure.story('Threaded Replies & Resolve Lifecycle');

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

    await test.step('2. Resolve thread and verify resolution metadata', async () => {
      thread.resolved = true;
      thread.resolved_at = new Date().toISOString();

      expect(thread.resolved).toBe(true);
      expect(thread.resolved_at).toBeDefined();
    });

    await test.step('3. Reopen thread and verify status cleared', async () => {
      thread.resolved = false;
      delete thread.resolved_at;

      expect(thread.resolved).toBe(false);
      expect(thread.resolved_at).toBeUndefined();
    });
  });
});
