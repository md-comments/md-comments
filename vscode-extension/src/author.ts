import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import {
  setCachedAuthor,
  isCacheValid,
  getCachedAuthor,
  fallbackAuthor,
} from '../../shared/author';
import { getOAuthToken } from './githubAuth';

// Re-export shared functions for compatibility
export {
  clearAuthorCache,
  getCachedAuthor,
  isGitHubLogin,
  githubProfileUrl,
  githubAvatarUrl,
  extractMentionLogins,
} from '../../shared/author';

const execFileAsync = promisify(execFile);

/** Preload GitHub username (e.g. on extension activate). */
export async function warmAuthorCache(): Promise<void> {
  await getAuthor();
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
    });
    const login = stdout.trim();
    return login || undefined;
  } catch {
    return undefined;
  }
}

async function getUsernameFromGitConfig(): Promise<string | undefined> {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!cwd) {
    return undefined;
  }
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'github.user'], { cwd });
    const user = stdout.trim();
    if (user) {
      return user;
    }
  } catch {
    /* ignore */
  }
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'user.name'], { cwd });
    const user = stdout.trim();
    if (user) {
      return user;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}
