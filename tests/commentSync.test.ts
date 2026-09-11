import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommentPollManager } from '../shared/commentSync';
import { GitHubOrphanRefBackend } from '../shared/gitRefBackend';

describe('CommentPollManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs periodic checks when started', async () => {
    const checkFn = vi.fn().mockResolvedValue(undefined);
    const poller = new CommentPollManager(checkFn, { intervalMs: 1000, minIntervalMs: 500 });

    expect(poller.running).toBe(false);
    poller.start();
    expect(poller.running).toBe(true);

    // Advance time by 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(checkFn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(checkFn).toHaveBeenCalledTimes(2);

    poller.stop();
    expect(poller.running).toBe(false);

    await vi.advanceTimersByTimeAsync(2000);
    expect(checkFn).toHaveBeenCalledTimes(2);
  });

  it('respects minIntervalMs when checkNow is triggered manually', async () => {
    const checkFn = vi.fn().mockResolvedValue(undefined);
    const poller = new CommentPollManager(checkFn, { intervalMs: 5000, minIntervalMs: 1000 });

    await poller.checkNow(true);
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Call immediately within cooldown without force -> should not call checkFn
    await poller.checkNow(false);
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Force call -> should call checkFn
    await poller.checkNow(true);
    expect(checkFn).toHaveBeenCalledTimes(2);
  });
});

describe('GitHubOrphanRefBackend.getLatestRefSha', () => {
  it('returns commit SHA when ref exists', async () => {
    const mockToken = 'mock-token';
    const backend = new GitHubOrphanRefBackend(() => mockToken);

    vi.spyOn(backend as any, 'fetchApi').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ref: 'refs/md-comments/data',
        object: { sha: 'commit-sha-1234567890' },
      }),
    } as any);

    const sha = await backend.getLatestRefSha('owner', 'repo');
    expect(sha).toBe('commit-sha-1234567890');
  });

  it('returns null when ref request fails or ref does not exist', async () => {
    const backend = new GitHubOrphanRefBackend(() => null);

    vi.spyOn(backend as any, 'fetchApi').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as any);

    const sha = await backend.getLatestRefSha('owner', 'repo');
    expect(sha).toBeNull();
  });
});
