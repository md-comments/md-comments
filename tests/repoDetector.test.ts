import { describe, it, expect } from 'vitest';
import { parseGitHubRemote, parseGitHubPageUrl } from '../shared/repoDetector';

describe('parseGitHubRemote', () => {
  it('parses HTTPS GitHub remote URLs', () => {
    expect(parseGitHubRemote('https://github.com/md-comments/md-comments.git')).toEqual({
      owner: 'md-comments',
      repo: 'md-comments',
    });
    expect(parseGitHubRemote('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('parses SSH GitHub remote URLs', () => {
    expect(parseGitHubRemote('git@github.com:owner/my-repo.git')).toEqual({
      owner: 'owner',
      repo: 'my-repo',
    });
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubRemote('https://gitlab.com/owner/repo.git')).toBeNull();
    expect(parseGitHubRemote(null)).toBeNull();
    expect(parseGitHubRemote('git@github.com:git/repo.git')).toBeNull();
  });
});

describe('parseGitHubPageUrl', () => {
  it('parses blob and raw page URLs', () => {
    const result = parseGitHubPageUrl('https://github.com/owner/repo/blob/main/docs/readme.md');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      filePath: 'docs/readme.md',
    });

    const rawResult = parseGitHubPageUrl('https://github.com/owner/repo/raw/feat/index.html');
    expect(rawResult).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'feat',
      filePath: 'index.html',
    });
  });

  it('parses non-blob GitHub repository URLs', () => {
    const result = parseGitHubPageUrl('https://github.com/owner/repo/pull/42');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('returns null for non-github URLs, incomplete paths, or malformed strings', () => {
    expect(parseGitHubPageUrl('https://example.com/owner/repo')).toBeNull();
    expect(parseGitHubPageUrl('https://github.com/onlyowner')).toBeNull();
    expect(parseGitHubPageUrl('not a valid url ://')).toBeNull();
  });
});
