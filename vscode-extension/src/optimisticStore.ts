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
  private mutationVersion = new Map<string, number>();
  private fetchQueue = new Map<string, Promise<CommentsFile>>();
  private writeQueue = new Map<string, Promise<void>>();
  private tombstones = new Map<string, Set<string>>();

  /**
   * Records a deleted comment or reply ID as a session tombstone
   * so stale remote fetches cannot resurrect it.
   */
  addTombstone(key: CommentStorageKey, idOrIds: string | string[] | Set<string>): void {
    const kStr = keyToString(key);
    let set = this.tombstones.get(kStr);
    if (!set) {
      set = new Set<string>();
      this.tombstones.set(kStr, set);
    }
    if (typeof idOrIds === 'string') {
      set.add(idOrIds);
    } else {
      for (const id of idOrIds) {
        set.add(id);
      }
    }
    logDebug(`OptimisticStore.addTombstone for ${kStr}, total tombstones: ${set.size}`);
  }

  /**
   * Retrieves active tombstones for a storage key.
   */
  getTombstones(key: CommentStorageKey): Set<string> {
    return this.tombstones.get(keyToString(key)) || new Set<string>();
  }

  /**
   * Clears active tombstones for a storage key upon forced manual refresh.
   */
  clearTombstones(key: CommentStorageKey): void {
    this.tombstones.delete(keyToString(key));
  }

  /**
   * Checks whether a remote write is currently in-flight for this key.
   */
  isWriting(key: CommentStorageKey): boolean {
    return this.writeQueue.has(keyToString(key));
  }

  /**
   * Filters a comments file removing any entries matching active tombstones.
   */
  private filterTombstones(key: CommentStorageKey, data: CommentsFile): CommentsFile {
    const kStr = keyToString(key);
    const dead = this.tombstones.get(kStr);
    if (!dead || dead.size === 0) {
      return data;
    }
    return {
      inline_comments: (data.inline_comments || [])
        .filter((c) => !dead.has(c.id))
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => !dead.has(r.id)),
        })),
      page_comments: (data.page_comments || [])
        .filter((c) => !dead.has(c.id))
        .map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => !dead.has(r.id)),
        })),
    };
  }

  /**
   * Retrieves comments for a key instantly from memory cache if fresh,
   * otherwise fetches from remote backend and populates memory cache.
   * If forceRefresh is true or cache TTL is expired, fetches from remote backend.
   * Concurrent calls for the same key reuse the active in-flight request.
   * If a local mutation occurs while a fetch is in flight, the stale fetch will NOT overwrite the cache.
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

    logDebug(
      `OptimisticStore.getComments for key: ${kStr}, forceRefresh=${forceRefresh}, isStale=${isStale}`
    );

    // If a background write is in flight, NEVER overwrite with remote data that doesn't have the write yet
    if (this.writeQueue.has(kStr) && this.cache.has(kStr)) {
      logDebug(
        `OptimisticStore.getComments write in-flight for ${kStr}, returning optimistic cache`
      );
      return this.filterTombstones(key, this.cache.get(kStr)!);
    }

    if (!forceRefresh && !isStale && this.cache.has(kStr)) {
      logDebug(`OptimisticStore.getComments Cache Hit (fresh) for key: ${kStr}`);
      return this.filterTombstones(key, this.cache.get(kStr)!);
    }

    if (!forceRefresh && this.fetchQueue.has(kStr)) {
      logDebug(`OptimisticStore.getComments joining in-flight fetch for key: ${kStr}`);
      const inFlight = await this.fetchQueue.get(kStr)!;
      return this.filterTombstones(key, inFlight);
    }

    const startVersion = this.mutationVersion.get(kStr) || 0;
    logDebug(
      `OptimisticStore.getComments Cache ${forceRefresh ? 'Force Bypass' : isStale ? 'Stale (TTL expired)' : 'Miss'}. Fetching remote (startVersion=${startVersion})...`
    );

    const currentFetch = (async () => {
      const rawRemote = await fetchRemote();
      const remoteData = this.filterTombstones(key, rawRemote);
      const currentVersion = this.mutationVersion.get(kStr) || 0;
      if (currentVersion !== startVersion || this.writeQueue.has(kStr)) {
        logDebug(
          `OptimisticStore.getComments Ignored stale remote data for ${kStr}: local mutation or active write in flight (v${startVersion} -> v${currentVersion}, writing=${this.writeQueue.has(kStr)})`
        );
        return this.filterTombstones(key, this.cache.get(kStr) || remoteData);
      }

      logDebug(`OptimisticStore.getComments Fetch Complete. comments loaded:`, {
        inline: remoteData?.inline_comments?.length || 0,
        page: remoteData?.page_comments?.length || 0,
      });
      this.cache.set(kStr, remoteData);
      this.cacheTime.set(kStr, Date.now());
      return remoteData;
    })();

    this.fetchQueue.set(kStr, currentFetch);
    currentFetch.finally(() => {
      if (this.fetchQueue.get(kStr) === currentFetch) {
        this.fetchQueue.delete(kStr);
      }
    });

    return currentFetch;
  }

  /**
   * Immediately updates memory cache (optimistic local mutation)
   * and queues a serialized background write operation to the remote backend.
   * Increments mutationVersion so any active background fetch cannot overwrite this mutation.
   */
  updateComments(
    key: CommentStorageKey,
    data: CommentsFile,
    writeRemote: () => Promise<unknown>,
    deletedIds?: Set<string>
  ): CommentsFile {
    const kStr = keyToString(key);
    if (deletedIds && deletedIds.size > 0) {
      this.addTombstone(key, deletedIds);
    }
    const currentVersion = (this.mutationVersion.get(kStr) || 0) + 1;
    this.mutationVersion.set(kStr, currentVersion);
    logDebug(`OptimisticStore.updateComments mutating cache for key: ${kStr} (v${currentVersion})`);
    const cleanData = this.filterTombstones(key, data);
    this.cache.set(kStr, cleanData);
    this.cacheTime.set(kStr, Date.now());
    this.fetchQueue.delete(kStr);

    const previousWrite = this.writeQueue.get(kStr) || Promise.resolve();
    const currentWrite = previousWrite
      .then(async () => {
        logDebug(`OptimisticStore.updateComments executing background write for key: ${kStr}`);
        await writeRemote();
        logDebug(`OptimisticStore.updateComments background write success for key: ${kStr}`);
      })
      .catch((err) => {
        logDebug(`OptimisticStore.updateComments Background remote write error for ${kStr}:`, err);
      })
      .finally(() => {
        if (this.writeQueue.get(kStr) === currentWrite) {
          this.writeQueue.delete(kStr);
        }
      });

    this.writeQueue.set(kStr, currentWrite);
    return cleanData;
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
   * Checks whether the comments for a given key are already present in cache.
   */
  hasCached(key: CommentStorageKey): boolean {
    const kStr = keyToString(key);
    return this.cache.has(kStr);
  }

  /**
   * Checks whether there is an active in-flight fetch operation for the given key.
   */
  isFetching(key: CommentStorageKey): boolean {
    const kStr = keyToString(key);
    return this.fetchQueue.has(kStr);
  }

  /**
   * Clears in-memory cache for a given key.
   */
  invalidate(key: CommentStorageKey): void {
    const kStr = keyToString(key);
    const currentVersion = (this.mutationVersion.get(kStr) || 0) + 1;
    this.mutationVersion.set(kStr, currentVersion);
    logDebug(`OptimisticStore.invalidate key: ${kStr} (v${currentVersion})`);
    this.cache.delete(kStr);
    this.cacheTime.delete(kStr);
    this.fetchQueue.delete(kStr);
  }

  /**
   * Clears all in-memory cache entries.
   */
  clearAll(): void {
    logDebug(`OptimisticStore.clearAll() invoked`);
    this.cache.clear();
    this.cacheTime.clear();
    this.mutationVersion.clear();
    this.fetchQueue.clear();
    this.writeQueue.clear();
    this.tombstones.clear();
  }
}

export const globalOptimisticStore = new OptimisticCommentStore();
