import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import {
  setCachedAuthor,
  isCacheValid,
  getCachedAuthor,
  fallbackAuthor,
} from '../../shared/author';

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
  const fromRemote = await getUsernameFromGitRemote();
  if (fromRemote) {
    return fromRemote;
  }
  const fromGh = await getUsernameFromGhCli();
  if (fromGh) {
    return fromGh;
  }
  return getUsernameFromGitConfig();
}

async function getUsernameFromGitHubSession(): Promise<string | undefined> {
  try {
    const session = await vscode.authentication.getSession('github', ['read:user'], {
      createIfNone: false,
      silent: true,
    });
    const label = session?.account?.label?.trim();
    if (label) {
      return label;
    }
  } catch {
    /* GitHub auth not available */
  }
  return undefined;
}

function parseGitHubUsernameFromRemote(url: string): string | undefined {
  const trimmed = url.trim();
  const match = trimmed.match(/github\.com[/:]([^/]+?)(?:\/|$)/i);
  const user = match?.[1]?.replace(/\.git$/i, '');
  if (!user || user === 'git') {
    return undefined;
  }
  return user;
}

async function getUsernameFromGitRemote(): Promise<string | undefined> {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!cwd) {
    return undefined;
  }
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], {
      cwd,
    });
    return parseGitHubUsernameFromRemote(stdout);
  } catch {
    return undefined;
  }
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
    return user || undefined;
  } catch {
    return undefined;
  }
}
