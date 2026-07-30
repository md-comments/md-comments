import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { extractMentionLogins, isGitHubLogin } from './author';
import type { CommentsFile, Reaction } from '../../shared/types';

const execFileAsync = promisify(execFile);

const CACHE_MS = 24 * 60 * 60 * 1000;
const FETCH_CONCURRENCY = 4;

type CacheEntry = {
  /** GitHub profile name; `null` = fetched, no public name (use login). */
  name: string | null;
  expiresAt: number;
};

const displayNameCache = new Map<string, CacheEntry>();

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let refreshScheduled = false;

export function clearGitHubDisplayNameCache(): void {
  displayNameCache.clear();
}

function cacheEntryValid(entry: CacheEntry | undefined): entry is CacheEntry {
  return !!entry && Date.now() < entry.expiresAt;
}

/** GitHub logins referenced in a comments file (authors, mentions, reactions). */
export function collectGitHubLogins(comments: CommentsFile): string[] {
  const logins = new Set<string>();
  const addAuthor = (author: string, body: string) => {
    if (isGitHubLogin(author)) {
      logins.add(author.trim());
    }
    for (const m of extractMentionLogins(body)) {
      logins.add(m);
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
    addAuthor(c.author, c.body);
    addReactions(c.reactions);
    for (const r of c.replies) {
      addAuthor(r.author, r.body);
      addReactions(r.reactions);
    }
  }
  for (const c of comments.inline_comments) {
    addAuthor(c.author, c.body);
    addReactions(c.reactions);
    for (const r of c.replies) {
      addAuthor(r.author, r.body);
      addReactions(r.reactions);
    }
  }
  return [...logins].sort((a, b) => a.localeCompare(b));
}

/** Cached GitHub profile full name, if known. */
export function getGitHubDisplayName(login: string): string | undefined {
  const key = login.trim();
  if (!isGitHubLogin(key)) {
    return undefined;
  }
  const entry = displayNameCache.get(key);
  if (!cacheEntryValid(entry) || !entry.name) {
    return undefined;
  }
  return entry.name;
}

function authorMatchKeys(author: string): Set<string> {
  const keys = new Set<string>();
  const raw = author.trim();
  if (!raw) {
    return keys;
  }
  keys.add(raw.toLowerCase());
  const login = resolveAuthorLogin(raw) ?? (isGitHubLogin(raw) ? raw : undefined);
  if (login) {
    keys.add(login.toLowerCase());
  }
  if (raw.includes('.')) {
    keys.add(raw.replace(/\./g, '').toLowerCase());
  }
  return keys;
}

/** Whether the stored comment author is the current user (login or display name). */
export function authorsMatch(storedAuthor: string, currentAuthor: string): boolean {
  const a = authorMatchKeys(storedAuthor);
  const c = authorMatchKeys(currentAuthor);
  if (!a.size || !c.size) {
    return false;
  }
  for (const key of a) {
    if (c.has(key)) {
      return true;
    }
  }
  return false;
}

/** GitHub login for avatar lookup (stored login or reverse match from display name). */
export function resolveAuthorLogin(author: string): string | undefined {
  const raw = author.trim();
  if (!raw) {
    return undefined;
  }
  if (isGitHubLogin(raw)) {
    return raw;
  }
  const lower = raw.toLowerCase();
  for (const [login, entry] of displayNameCache) {
    if (cacheEntryValid(entry) && entry.name && entry.name.toLowerCase() === lower) {
      return login;
    }
  }
  return undefined;
}

/** Label for UI: full name when cached, otherwise the stored author string. */
export function authorDisplayLabel(author: string): string {
  const raw = author.trim();
  if (isGitHubLogin(raw)) {
    return getGitHubDisplayName(raw) ?? raw;
  }
  const login = resolveAuthorLogin(raw);
  if (login) {
    return getGitHubDisplayName(login) ?? raw;
  }
  return raw;
}

export function displayNamesMapForLogins(logins: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const login of logins) {
    const name = getGitHubDisplayName(login);
    if (name) {
      out[login] = name;
    }
  }
  return out;
}

/**
 * Fetches missing GitHub profile names. Returns how many logins gained a display name.
 */
export async function warmGitHubDisplayNames(logins: string[]): Promise<number> {
  const needed = logins.filter(
    (l) => isGitHubLogin(l) && !cacheEntryValid(displayNameCache.get(l))
  );
  if (!needed.length) {
    return 0;
  }

  let resolved = 0;
  for (let i = 0; i < needed.length; i += FETCH_CONCURRENCY) {
    const batch = needed.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((login) => fetchDisplayName(login)));
    for (let j = 0; j < batch.length; j++) {
      const login = batch[j];
      const name = results[j];
      displayNameCache.set(login, {
        name: name ?? null,
        expiresAt: Date.now() + CACHE_MS,
      });
      if (name) {
        resolved++;
      }
    }
  }
  return resolved;
}

export function schedulePreviewRefreshAfterDisplayNames(): void {
  if (refreshScheduled) {
    return;
  }
  refreshScheduled = true;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshScheduled = false;
    refreshTimer = undefined;
    void vscode.commands.executeCommand('markdown.preview.refresh');
  }, 400);
}

async function fetchDisplayName(login: string): Promise<string | undefined> {
  const fromGh = await fetchNameViaGhCli(login);
  if (fromGh) {
    return fromGh;
  }
  return fetchNameViaGitHubApi(login);
}

async function fetchNameViaGhCli(login: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('gh', ['api', `users/${login}`, '-q', '.name'], {
      timeout: 6000,
    });
    const name = stdout.trim();
    return name || undefined;
  } catch {
    return undefined;
  }
}

async function fetchNameViaGitHubApi(login: string): Promise<string | undefined> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'MD-Comments',
    };
    const session = await vscode.authentication.getSession('github', [], {
      createIfNone: false,
      silent: true,
    });
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers,
    });
    if (!res.ok) {
      return undefined;
    }
    const data = (await res.json()) as { name?: string | null };
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    return name || undefined;
  } catch {
    return undefined;
  }
}
