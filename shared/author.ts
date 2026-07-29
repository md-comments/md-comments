const CACHE_MS = 5 * 60 * 1000;

let cachedUsername: string | undefined;
let cacheExpiresAt = 0;

export function clearAuthorCache(): void {
  cachedUsername = undefined;
  cacheExpiresAt = 0;
}

export function getCachedAuthor(): string | undefined {
  return cachedUsername;
}

export function setCachedAuthor(username: string): void {
  cachedUsername = username;
  cacheExpiresAt = Date.now() + CACHE_MS;
}

export function isCacheValid(): boolean {
  return !!cachedUsername && Date.now() < cacheExpiresAt;
}

export function fallbackAuthor(): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.USER || process.env.USERNAME || 'anonymous';
  }
  return 'anonymous';
}

/** GitHub login rules (simplified): alphanumeric + hyphen, 1–39 chars. */
export function isGitHubLogin(name: string): boolean {
  const login = name.trim();
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37})$/.test(login);
}

export function githubProfileUrl(login: string): string {
  return `https://github.com/${encodeURIComponent(login.trim())}`;
}

/** Public GitHub avatar URL (prefer warmGitHubAvatars data URLs in preview). */
export function githubAvatarUrl(login: string, size = 48): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(login.trim())}?s=${size}`;
}

const MENTION_RE = /@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}))/g;

export function extractMentionLogins(text: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (isGitHubLogin(m[1])) {
      found.add(m[1]);
    }
  }
  return [...found];
}
