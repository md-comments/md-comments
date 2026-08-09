import type { CommentStorageKey } from '../../shared/commentStorage';
import type { CommentsFile } from '../../shared/types';
import { logDebug } from './logger';

function keyToString(key: CommentStorageKey): string {
  return `${key.owner}/${key.repo}/${key.filePath}`;
}

const DEFAULT_TTL_MS = 15000; // 15 seconds cache TTL

export class OptimisticCommentStore {
  private cache = new Map<string, CommentsFile>();
  private cacheTime = new Map<string, number>();
  private writeQueue = new Map<string, Promise<void>>();

  /**
   * Retrieves comments for a key instantly from memory cache if fresh,
   * otherwise fetches from remote backend and populates memory cache.
   * If forceRefresh is true or cache TTL is expired, fetches from remote backend.
   */
  async getComments(
    key: CommentStorageKey,
    fetchRemote: () => Promise<CommentsFile>,
    forceRefresh = false
  ): Promise<CommentsFile> {
    const kStr = keyToString(key);
    const now = Date.now();
    const cachedTime = this.cacheTime.get(kStr) || 0;
    const isStale = now - cachedTime > DEFAULT_TTL_MS;

    logDebug(`OptimisticStore.getComments for key: ${kStr}, forceRefresh=${forceRefresh}, isStale=${isStale}`);

    if (!forceRefresh && !isStale && this.cache.has(kStr)) {
      logDebug(`OptimisticStore.getComments Cache Hit (fresh) for key: ${kStr}`);
      return this.cache.get(kStr)!;
    }

    logDebug(`OptimisticStore.getComments Cache ${forceRefresh ? 'Force Bypass' : isStale ? 'Stale (TTL expired)' : 'Miss'}. Fetching remote...`);
    const remoteData = await fetchRemote();
    logDebug(`OptimisticStore.getComments Fetch Complete. comments loaded:`, {
      inline: remoteData?.inline_comments?.length || 0,
      page: remoteData?.page_comments?.length || 0,
    });
    this.cache.set(kStr, remoteData);
    this.cacheTime.set(kStr, Date.now());
    return remoteData;
  }

  /**
   * Immediately updates memory cache (optimistic local mutation)
   * and queues a serialized background write operation to the remote backend.
   */
  updateComments(
    key: CommentStorageKey,
    data: CommentsFile,
    writeRemote: () => Promise<void>
  ): CommentsFile {
    const kStr = keyToString(key);
    logDebug(`OptimisticStore.updateComments mutating cache for key: ${kStr}`);
    this.cache.set(kStr, data);
    this.cacheTime.set(kStr, Date.now());

    const previousWrite = this.writeQueue.get(kStr) || Promise.resolve();
    const currentWrite = previousWrite
      .then(async () => {
        logDebug(`OptimisticStore.updateComments executing background write for key: ${kStr}`);
        await writeRemote();
        logDebug(`OptimisticStore.updateComments background write success for key: ${kStr}`);
      })
      .catch((err) => {
        logDebug(`OptimisticStore.updateComments Background remote write error for ${kStr}:`, err);
      });

    this.writeQueue.set(kStr, currentWrite);
    return data;
  }

  /**
   * Returns current cached comments synchronously if available.
   */
  getCached(key: CommentStorageKey): CommentsFile | undefined {
    const kStr = keyToString(key);
    const val = this.cache.get(kStr);
    logDebug(`OptimisticStore.getCached key: ${kStr} -> present: ${!!val}`);
    return val;
  }

  /**
   * Clears in-memory cache for a given key.
   */
  invalidate(key: CommentStorageKey): void {
    const kStr = keyToString(key);
    logDebug(`OptimisticStore.invalidate key: ${kStr}`);
    this.cache.delete(kStr);
    this.cacheTime.delete(kStr);
  }

  /**
   * Clears all in-memory cache entries.
   */
  clearAll(): void {
    logDebug(`OptimisticStore.clearAll() invoked`);
    this.cache.clear();
    this.cacheTime.clear();
    this.writeQueue.clear();
  }
}

export const globalOptimisticStore = new OptimisticCommentStore();
