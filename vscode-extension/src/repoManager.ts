import * as path from 'path';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { parseGitHubRemote, type GitHubRepoInfo } from '../../shared/repoDetector';
import type { CommentStorageKey } from '../../shared/commentStorage';
import { logDebug } from './logger';

const execFileAsync = promisify(execFile);
const remoteUrlCache = new Map<string, string | null>();

export function getGitRemoteUrlSync(cwd: string): string | null {
  if (remoteUrlCache.has(cwd)) {
    logDebug(`getGitRemoteUrlSync cache hit for cwd: ${cwd} -> ${remoteUrlCache.get(cwd)}`);
    return remoteUrlCache.get(cwd)!;
  }
  try {
    const stdout = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd,
      encoding: 'utf8',
      timeout: 2000,
    });
    const url = stdout.trim() || null;
    logDebug(`getGitRemoteUrlSync resolved remote.origin.url: ${url}`);
    remoteUrlCache.set(cwd, url);
    return url;
  } catch (err) {
    logDebug(`getGitRemoteUrlSync failed for cwd: ${cwd}`, err);
    remoteUrlCache.set(cwd, null);
    return null;
  }
}

export async function getGitRemoteUrl(cwd: string): Promise<string | null> {
  if (remoteUrlCache.has(cwd)) {
    logDebug(`getGitRemoteUrl cache hit for cwd: ${cwd} -> ${remoteUrlCache.get(cwd)}`);
    return remoteUrlCache.get(cwd)!;
  }
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], { cwd });
    const url = stdout.trim() || null;
    logDebug(`getGitRemoteUrl resolved remote.origin.url: ${url}`);
    remoteUrlCache.set(cwd, url);
    return url;
  } catch (err) {
    logDebug(`getGitRemoteUrl failed for cwd: ${cwd}`, err);
    remoteUrlCache.set(cwd, null);
    return null;
  }
}

export function resolveStorageKeyForUriSync(mdUri: vscode.Uri): CommentStorageKey | null {
  logDebug(`resolveStorageKeyForUriSync mdUri: ${mdUri.toString()}`);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(mdUri);
  const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(mdUri.fsPath);
  logDebug(`resolveStorageKeyForUriSync workspaceFolder: ${workspaceFolder?.uri.toString() || 'none'}, cwd: ${cwd}`);

  const remoteUrl = getGitRemoteUrlSync(cwd);
  logDebug(`resolveStorageKeyForUriSync remoteUrl: ${remoteUrl}`);
  const repoInfo: GitHubRepoInfo | null = parseGitHubRemote(remoteUrl);
  logDebug(`resolveStorageKeyForUriSync parseGitHubRemote result:`, repoInfo);

  if (!repoInfo) {
    logDebug(`resolveStorageKeyForUriSync failed to resolve repoInfo for mdUri: ${mdUri.toString()}`);
    return null;
  }

  let relativePath = mdUri.fsPath;
  if (workspaceFolder) {
    relativePath = path.relative(workspaceFolder.uri.fsPath, mdUri.fsPath);
  } else {
    relativePath = path.basename(mdUri.fsPath);
  }

  const posixPath = relativePath.split(path.sep).join('/');
  logDebug(`resolveStorageKeyForUriSync posix relativePath: ${posixPath}`);

  return {
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    filePath: posixPath,
  };
}

export async function resolveStorageKeyForUri(mdUri: vscode.Uri): Promise<CommentStorageKey | null> {
  logDebug(`resolveStorageKeyForUri mdUri: ${mdUri.toString()}`);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(mdUri);
  const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(mdUri.fsPath);
  logDebug(`resolveStorageKeyForUri workspaceFolder: ${workspaceFolder?.uri.toString() || 'none'}, cwd: ${cwd}`);

  const remoteUrl = await getGitRemoteUrl(cwd);
  logDebug(`resolveStorageKeyForUri remoteUrl: ${remoteUrl}`);
  const repoInfo: GitHubRepoInfo | null = parseGitHubRemote(remoteUrl);
  logDebug(`resolveStorageKeyForUri parseGitHubRemote result:`, repoInfo);

  if (!repoInfo) {
    logDebug(`resolveStorageKeyForUri failed to resolve repoInfo for mdUri: ${mdUri.toString()}`);
    return null;
  }

  let relativePath = mdUri.fsPath;
  if (workspaceFolder) {
    relativePath = path.relative(workspaceFolder.uri.fsPath, mdUri.fsPath);
  } else {
    relativePath = path.basename(mdUri.fsPath);
  }

  const posixPath = relativePath.split(path.sep).join('/');
  logDebug(`resolveStorageKeyForUri posix relativePath: ${posixPath}`);

  return {
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    filePath: posixPath,
  };
}
