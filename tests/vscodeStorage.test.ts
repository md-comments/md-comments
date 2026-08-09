import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimisticCommentStore } from '../vscode-extension/src/optimisticStore';
import type { CommentStorageKey } from '../shared/commentStorage';
import type { CommentsFile } from '../shared/types';

describe('OptimisticCommentStore', () => {
  let store: OptimisticCommentStore;
  const sampleKey: CommentStorageKey = {
    owner: 'test-owner',
    repo: 'test-repo',
    filePath: 'docs/guide.md',
  };

  const sampleComments: CommentsFile = {
    inline_comments: [
      {
        id: 'c1',
        author: 'user1',
        anchor_text: 'hello',
        anchor_hash: 'hash1',
        paragraph_index: 0,
        heading_context: 'Intro',
        body: 'Optimistic comment',
        created_at: '2026-08-04T12:00:00Z',
        orphaned: false,
        resolved: false,
        reactions: [],
        replies: [],
      },
    ],
    page_comments: [],
  };

  beforeEach(() => {
    store = new OptimisticCommentStore();
  });

  it('fetches remote on cold read and caches result in memory', async () => {
    const fetchRemote = vi.fn().mockResolvedValue(sampleComments);

    const firstResult = await store.getComments(sampleKey, fetchRemote);
    expect(firstResult).toEqual(sampleComments);
    expect(fetchRemote).toHaveBeenCalledTimes(1);

    // Second read hits memory cache instantly without remote call
    const secondResult = await store.getComments(sampleKey, fetchRemote);
    expect(secondResult).toEqual(sampleComments);
    expect(fetchRemote).toHaveBeenCalledTimes(1);
  });

  it('updates cache instantly and queues background remote write', async () => {
    let writeExecuted = false;
    const writeRemote = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 50));
      writeExecuted = true;
    });

    const updated = store.updateComments(sampleKey, sampleComments, writeRemote);

    // Synchronous memory cache update
    expect(updated).toEqual(sampleComments);
    expect(store.getCached(sampleKey)).toEqual(sampleComments);
    expect(writeExecuted).toBe(false);

    // Wait for background queue execution
    await new Promise((r) => setTimeout(r, 100));
    expect(writeExecuted).toBe(true);
    expect(writeRemote).toHaveBeenCalledTimes(1);
  });

  it('serializes multiple background writes in order', async () => {
    const executionOrder: number[] = [];

    const write1 = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 30));
      executionOrder.push(1);
    });

    const write2 = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      executionOrder.push(2);
    });

    store.updateComments(sampleKey, sampleComments, write1);
    store.updateComments(sampleKey, sampleComments, write2);

    await new Promise((r) => setTimeout(r, 100));
    expect(executionOrder).toEqual([1, 2]);
  });
});
