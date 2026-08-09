export interface GitHubRepoInfo {
  owner: string;
  repo: string;
}

/**
 * Parses GitHub owner and repo from an SSH or HTTPS Git remote URL.
 * Handles formats like:
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo
 */
export function parseGitHubRemote(url: string | null | undefined): GitHubRepoInfo | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/github\.com[/:]([^/]+)\/([^/\s]+?)(?:\.git)?$/i);
  if (!match || !match[1] || !match[2]) {
    return null;
  }
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, '');
  if (owner === 'git' || !owner || !repo) {
    return null;
  }
  return { owner, repo };
}

/**
 * Parses GitHub owner, repo, and filePath from a github.com page URL.
 */
export function parseGitHubPageUrl(urlStr: string): {
  owner: string;
  repo: string;
  branch?: string;
  filePath?: string;
} | null {
  try {
    const url = new URL(urlStr);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    if (parts[2] === 'blob' || parts[2] === 'raw') {
      const branch = parts[3];
      const filePath = parts.slice(4).join('/');
      return { owner, repo, branch, filePath };
    }

    return { owner, repo };
  } catch {
    return null;
  }
}
