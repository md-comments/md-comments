/* global NodeJS */
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import {
  setCachedAuthor,
  isCacheValid,
  getCachedAuthor,
  fallbackAuthor,
  isGitHubLogin,
  clearAuthorCache as clearSharedAuthorCache,
} from '../../shared/author';
import { getOAuthToken } from './githubAuth';
import {
  getGitHubDisplayName,
  setGitHubDisplayName,
  registerAuthorDisplayNameProvider,
} from './githubDisplayNames';

// Re-export shared functions for compatibility
export {
  getCachedAuthor,
  isGitHubLogin,
  githubProfileUrl,
  githubAvatarUrl,
  extractMentionLogins,
} from '../../shared/author';

const execFileAsync = promisify(execFile);

export function getExecEnv(): NodeJS.ProcessEnv {
  const currentPath = process.env.PATH || '';
  const extraPaths = ['/opt/homebrew/bin', '/usr/local/bin'];
  const missing = extraPaths.filter((p) => !currentPath.includes(p));
  return {
    ...process.env,
    PATH: missing.length ? `${missing.join(':')}:${currentPath}` : currentPath,
  };
}

let cachedDisplayName: string | undefined;

export function clearAuthorCache(): void {
  clearSharedAuthorCache();
  cachedDisplayName = undefined;
}

export function getCachedAuthorDisplayName(): string | undefined {
  if (cachedDisplayName) {
    return cachedDisplayName;
  }
  const author = getCachedAuthor();
  if (author) {
    const fromMap = getGitHubDisplayName(author);
    if (fromMap && fromMap !== author) {
      cachedDisplayName = fromMap;
      return fromMap;
    }
  }
  try {
    const stdout = execFileSync('git', ['config', '--get', 'user.name'], {
      encoding: 'utf8',
      timeout: 1000,
      env: getExecEnv(),
    }).trim();
    if (stdout) {
      cachedDisplayName = stdout;
      if (author && isGitHubLogin(author)) {
        setGitHubDisplayName(author, stdout);
      }
      return stdout;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export function setCachedAuthorDisplayName(name: string | undefined): void {
  cachedDisplayName = name?.trim() || undefined;
}

registerAuthorDisplayNameProvider(getCachedAuthorDisplayName);

/** Preload GitHub username and display name (e.g. on extension activate). */
export async function warmAuthorCache(): Promise<void> {
  await getAuthor();
  await getAuthorDisplayName();
}

/**
 * Author for new comments and reactions — GitHub login when available.
 */
export async function getAuthor(): Promise<string> {
  if (isCacheValid()) {
    return getCachedAuthor()!;
  }

  const username = await resolveGitHubUsername();
  const activeUser = username ?? fallbackAuthor();
  setCachedAuthor(activeUser);
  return activeUser;
}

/**
 * Display name for current user (e.g. "Marat Strelets"), falling back to GitHub login.
 */
export async function getAuthorDisplayName(): Promise<string> {
  if (cachedDisplayName) {
    return cachedDisplayName;
  }
  const author = await getAuthor();
  const cachedFromMap = getGitHubDisplayName(author);
  if (cachedFromMap && cachedFromMap !== author) {
    cachedDisplayName = cachedFromMap;
    return cachedFromMap;
  }

  const fromGit = await getDisplayNameFromGitConfig();
  if (fromGit) {
    cachedDisplayName = fromGit;
    if (isGitHubLogin(author)) {
      setGitHubDisplayName(author, fromGit);
    }
    return fromGit;
  }

  const fromGh = await getDisplayNameFromGhCli();
  if (fromGh) {
    cachedDisplayName = fromGh;
    if (isGitHubLogin(author)) {
      setGitHubDisplayName(author, fromGh);
    }
    return fromGh;
  }

  const fromToken = await getDisplayNameFromOAuthToken();
  if (fromToken) {
    cachedDisplayName = fromToken;
    if (isGitHubLogin(author)) {
      setGitHubDisplayName(author, fromToken);
    }
    return fromToken;
  }

  return author;
}

async function resolveGitHubUsername(): Promise<string | undefined> {
  const fromSession = await getUsernameFromGitHubSession();
  if (fromSession) {
    return fromSession;
  }
  const fromToken = await getUsernameFromOAuthToken();
  if (fromToken) {
    return fromToken;
  }
  const fromGh = await getUsernameFromGhCli();
  if (fromGh) {
    return fromGh;
  }
  return getUsernameFromGitConfig();
}

async function getUsernameFromGitHubSession(): Promise<string | undefined> {
  try {
    let session = await vscode.authentication.getSession('github', ['read:user'], {
      createIfNone: false,
      silent: true,
    });
    if (!session) {
      session = await vscode.authentication.getSession('github', ['repo'], {
        createIfNone: false,
        silent: true,
      });
    }
    const label = session?.account?.label?.trim();
    if (label) {
      return label;
    }
  } catch {
    /* GitHub auth not available */
  }
  return undefined;
}

async function getUsernameFromOAuthToken(): Promise<string | undefined> {
  try {
    const token = await getOAuthToken();
    if (!token) {
      return undefined;
    }
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'VSCode-MD-Comments-Extension',
      },
    });
    if (res.ok) {
      const data = (await res.json()) as { login?: string };
      if (data.login) {
        return data.login;
      }
    }
  } catch {
    /* ignore fetch error */
  }
  return undefined;
}

async function getUsernameFromGhCli(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('gh', ['api', 'user', '-q', '.login'], {
      timeout: 4000,
      env: getExecEnv(),
    });
    const login = stdout.trim();
    return login || undefined;
  } catch {
    return undefined;
  }
}

async function getUsernameFromGitConfig(): Promise<string | undefined> {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const options = { cwd: cwd || undefined, env: getExecEnv() };
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'github.user'], options);
    const user = stdout.trim();
    if (user) {
      return user;
    }
  } catch {
    /* ignore */
  }
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'user.name'], options);
    const user = stdout.trim();
    if (user) {
      return user;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function getDisplayNameFromGitConfig(): Promise<string | undefined> {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'user.name'], {
      cwd: cwd || undefined,
      env: getExecEnv(),
    });
    const name = stdout.trim();
    if (name) {
      return name;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function getDisplayNameFromGhCli(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('gh', ['api', 'user', '-q', '.name'], {
      timeout: 4000,
      env: getExecEnv(),
    });
    const name = stdout.trim();
    if (name) {
      return name;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function getDisplayNameFromOAuthToken(): Promise<string | undefined> {
  try {
    const token = await getOAuthToken();
    if (!token) {
      return undefined;
    }
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'VSCode-MD-Comments-Extension',
      },
    });
    if (res.ok) {
      const data = (await res.json()) as { name?: string | null };
      if (typeof data.name === 'string' && data.name.trim()) {
        return data.name.trim();
      }
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
