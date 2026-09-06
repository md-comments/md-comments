import { escapeHtml } from './html';
import { isGitHubLogin, githubProfileUrl } from './author';

export interface CollaboratorUser {
  login: string;
  name?: string;
  avatarUrl: string;
}

export interface MentionQueryContext {
  query: string;
  start: number;
  end: number;
}

/**
 * Formats a comment body by escaping HTML and converting @mentions into clickable links.
 * If a resolveName function is provided, the mention displays the person's resolved name
 * (with the GitHub handle in the title hover attribute), or the username handle if unresolved.
 */
export function formatCommentBodyWithMentions(
  body: string,
  resolveName?: (login: string) => string | undefined
): string {
  if (!body) return '';
  const escaped = escapeHtml(body);
  return escaped.replace(
    /(^|[^\w@])@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}))(?![a-zA-Z0-9-])/g,
    (match, prefix: string, login: string) => {
      if (!isGitHubLogin(login)) {
        return match;
      }
      const displayName = resolveName ? resolveName(login) : undefined;
      const hasDisplayName = Boolean(
        displayName &&
        displayName.trim() &&
        displayName.trim().toLowerCase() !== login.toLowerCase()
      );
      const label = hasDisplayName ? `@${displayName!.trim()}` : `@${login}`;
      const title = hasDisplayName ? ` title="@${escapeHtml(login)}"` : '';
      const href = githubProfileUrl(login);
      return `${prefix}<a href="${href}" class="md-comments-mention"${title} target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    }
  );
}

/**
 * Parses the mention query at the current cursor position.
 * Returns the query (lowercased without the '@') and the replacement range [start, end],
 * or null if the cursor is not currently positioned inside an '@mention'.
 */
export function getMentionQueryAtCursor(
  text: string,
  cursorPosition: number
): MentionQueryContext | null {
  if (cursorPosition < 0 || cursorPosition > text.length) {
    return null;
  }
  const before = text.slice(0, cursorPosition);
  // Match @ preceded by start of string, newline, or whitespace
  const match = /(?:^|[\s\n])@([a-zA-Z0-9_-]*)$/.exec(before);
  if (!match) {
    return null;
  }
  const query = match[1];
  const atIndex = before.length - query.length - 1;
  return {
    query: query.toLowerCase(),
    start: atIndex,
    end: cursorPosition,
  };
}

/**
 * Filters a list of collaborator users matching a given search query against login or name.
 */
export function filterCollaborators(
  users: CollaboratorUser[],
  query: string,
  limit = 8
): CollaboratorUser[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    return users.slice(0, limit);
  }
  const startsWithLogin: CollaboratorUser[] = [];
  const containsLoginOrName: CollaboratorUser[] = [];

  for (const u of users) {
    const login = u.login.toLowerCase();
    const name = (u.name || '').toLowerCase();
    if (login.startsWith(q)) {
      startsWithLogin.push(u);
    } else if (login.includes(q) || (name && name.includes(q))) {
      containsLoginOrName.push(u);
    }
  }

  return [...startsWithLogin, ...containsLoginOrName].slice(0, limit);
}

const COLLABORATOR_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  users: CollaboratorUser[];
  expiresAt: number;
}

const collaboratorCache = new Map<string, CacheEntry>();

export function clearCollaboratorCache(): void {
  collaboratorCache.clear();
}

/**
 * Fetches repository collaborators (falling back to assignees) with a 15-minute memory cache.
 */
export async function fetchCollaborators(
  owner: string,
  repo: string,
  getToken: () => Promise<string | null> | string | null,
  fetchFn: typeof fetch = fetch
): Promise<CollaboratorUser[]> {
  const cacheKey = `${owner}/${repo}`.toLowerCase();
  const cached = collaboratorCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.users;
  }

  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response | null = null;
  try {
    res = await fetchFn(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators?per_page=100`,
      { headers }
    );
  } catch {
    res = null;
  }

  // Fallback to /assignees if /collaborators returns 403 or other non-OK status
  if (!res || !res.ok) {
    try {
      res = await fetchFn(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/assignees?per_page=100`,
        { headers }
      );
    } catch {
      res = null;
    }
  }

  // Fallback to public /contributors endpoint if /assignees also returns non-OK
  if (!res || !res.ok) {
    try {
      res = await fetchFn(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=100`,
        { headers }
      );
    } catch {
      res = null;
    }
  }

  if (!res || !res.ok) {
    return cached ? cached.users : [];
  }

  const data = (await res.json().catch(() => [])) as Array<{
    login?: string;
    name?: string;
    avatar_url?: string;
  }>;

  if (!Array.isArray(data)) {
    return cached ? cached.users : [];
  }

  const users: CollaboratorUser[] = data
    .filter((u) => u && typeof u.login === 'string')
    .map((u) => ({
      login: u.login!,
      name: u.name,
      avatarUrl:
        u.avatar_url ||
        `https://avatars.githubusercontent.com/${encodeURIComponent(u.login!)}?s=48`,
    }));

  collaboratorCache.set(cacheKey, {
    users,
    expiresAt: Date.now() + COLLABORATOR_CACHE_TTL_MS,
  });

  return users;
}
