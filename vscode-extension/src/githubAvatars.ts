import { isGitHubLogin } from './author';
import { resolveAuthorLogin } from './githubDisplayNames';
import type { CommentsFile, Reaction } from '../../shared/types';

const CACHE_MS = 24 * 60 * 60 * 1000;
const FETCH_CONCURRENCY = 4;
const MAX_AVATAR_BYTES = 200_000;

type AvatarCacheEntry = {
  dataUrl: string | null;
  expiresAt: number;
};

const avatarCache = new Map<string, AvatarCacheEntry>();

function cacheKey(login: string, size: number): string {
  return `${login.trim().toLowerCase()}@${size}`;
}

function cacheEntryValid(entry: AvatarCacheEntry | undefined): entry is AvatarCacheEntry {
  return !!entry && Date.now() < entry.expiresAt;
}

function avatarFetchUrl(login: string, size: number): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(login.trim())}?s=${size}`;
}

/** Collect logins to fetch avatars for (after display names are warmed). */
export function collectAvatarLogins(comments: CommentsFile): string[] {
  const logins = new Set<string>();
  const add = (author: string) => {
    const login = resolveAuthorLogin(author);
    if (login) {
      logins.add(login);
    }
  };
  const addReactions = (reactions: Reaction[]) => {
    for (const r of reactions) {
      for (const u of r.users) {
        if (isGitHubLogin(u)) {
          logins.add(u.trim());
        }
      }
    }
  };
  for (const c of comments.page_comments) {
    add(c.author);
    addReactions(c.reactions);
    for (const r of c.replies) {
      add(r.author);
      addReactions(r.reactions);
    }
  }
  for (const c of comments.inline_comments) {
    add(c.author);
    addReactions(c.reactions);
    for (const r of c.replies) {
      add(r.author);
      addReactions(r.reactions);
    }
  }
  return [...logins].sort((a, b) => a.localeCompare(b));
}

export function getAvatarDataUrl(login: string, size: number): string | undefined {
  const key = cacheKey(login, size);
  const entry = avatarCache.get(key);
  if (!cacheEntryValid(entry) || !entry.dataUrl) {
    return undefined;
  }
  return entry.dataUrl;
}

/** Fetches avatars in extension host and caches as data URLs for preview CSP. */
export async function warmGitHubAvatars(logins: string[]): Promise<number> {
  const needed = logins.filter(
    (l) => isGitHubLogin(l) && !cacheEntryValid(avatarCache.get(cacheKey(l, 48)))
  );
  if (!needed.length) {
    return 0;
  }

  let resolved = 0;
  for (let i = 0; i < needed.length; i += FETCH_CONCURRENCY) {
    const batch = needed.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((login) => fetchAvatarDataUrl(login, 48)));
    for (let j = 0; j < batch.length; j++) {
      const login = batch[j];
      const dataUrl = results[j];
      avatarCache.set(cacheKey(login, 48), {
        dataUrl: dataUrl ?? null,
        expiresAt: Date.now() + CACHE_MS,
      });
      if (dataUrl) {
        avatarCache.set(cacheKey(login, 64), {
          dataUrl: dataUrl,
          expiresAt: Date.now() + CACHE_MS,
        });
        resolved++;
      }
    }
  }
  return resolved;
}

async function fetchAvatarDataUrl(login: string, size: number): Promise<string | undefined> {
  try {
    const res = await fetch(avatarFetchUrl(login, size), {
      headers: { 'User-Agent': 'MD-Comments' },
    });
    if (!res.ok) {
      return undefined;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_AVATAR_BYTES) {
      return undefined;
    }
    const mime = (res.headers.get('content-type') || 'image/png').split(';')[0].trim();
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}
