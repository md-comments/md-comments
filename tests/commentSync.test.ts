import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommentPollManager } from '../shared/commentSync';
import { GitHubOrphanRefBackend } from '../shared/gitRefBackend';

describe('CommentPollManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs periodic checks when started', async () => {
    const checkFn = vi.fn().mockResolvedValue(undefined);
    const poller = new CommentPollManager(checkFn, { intervalMs: 1000, minIntervalMs: 500 });

    expect(poller.running).toBe(false);
    poller.start();
    expect(poller.running).toBe(true);

    // Call start again when already running -> noop
    poller.start();
    expect(poller.running).toBe(true);

    // Advance time by 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(checkFn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(checkFn).toHaveBeenCalledTimes(2);

    poller.stop();
    expect(poller.running).toBe(false);

    // Call stop again when already stopped -> noop
    poller.stop();

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

  it('attaches and triggers visibilitychange and focus listeners when DOM is present', async () => {
    const listeners: Record<string, () => void> = {};
    const mockDoc = {
      hidden: false,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
    };
    const mockWin = {
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
    };

    vi.stubGlobal('document', mockDoc);
    vi.stubGlobal('window', mockWin);

    const checkFn = vi.fn().mockResolvedValue(undefined);
    const poller = new CommentPollManager(checkFn, { intervalMs: 10000, minIntervalMs: 0 });

    poller.start();
    expect(mockDoc.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(mockWin.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));

    // Trigger focus
    listeners['focus']();
    await vi.advanceTimersByTimeAsync(10);
    expect(checkFn).toHaveBeenCalledTimes(1);

    // Trigger visibilitychange when document.hidden is false
    mockDoc.hidden = false;
    listeners['visibilitychange']();
    await vi.advanceTimersByTimeAsync(10);
    expect(checkFn).toHaveBeenCalledTimes(2);

    // Trigger visibilitychange when document.hidden is true -> no call
    mockDoc.hidden = true;
    listeners['visibilitychange']();
    await vi.advanceTimersByTimeAsync(10);
    expect(checkFn).toHaveBeenCalledTimes(2);

    poller.stop();
    expect(mockDoc.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(mockWin.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function));

    vi.unstubAllGlobals();
  });

  it('catches and logs error when checkFn throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const checkFn = vi.fn().mockRejectedValue(new Error('Network offline'));
    const poller = new CommentPollManager(checkFn, { intervalMs: 5000, minIntervalMs: 0 });

    await poller.checkNow(true);
    expect(warnSpy).toHaveBeenCalledWith('[md-comments] poll check failed:', expect.any(Error));
  });
});

describe('GitHubOrphanRefBackend.getLatestRefSha', () => {
  it('returns commit SHA when ref exists as single object', async () => {
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

  it('returns commit SHA when ref exists as an array', async () => {
    const mockToken = 'mock-token';
    const backend = new GitHubOrphanRefBackend(() => mockToken);

    vi.spyOn(backend as any, 'fetchApi').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          ref: 'refs/md-comments/data',
          object: { sha: 'commit-sha-array-999' },
        },
      ],
    } as any);

    const sha = await backend.getLatestRefSha('owner', 'repo');
    expect(sha).toBe('commit-sha-array-999');
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

  it('returns null when fetchApi throws an exception', async () => {
    const backend = new GitHubOrphanRefBackend(() => null);

    vi.spyOn(backend as any, 'fetchApi').mockRejectedValueOnce(new Error('DNS Failure'));

    const sha = await backend.getLatestRefSha('owner', 'repo');
    expect(sha).toBeNull();
  });
});
