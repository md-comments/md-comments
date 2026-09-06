import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearAuthorCache,
  getCachedAuthor,
  setCachedAuthor,
  isCacheValid,
  fallbackAuthor,
  isGitHubLogin,
  githubProfileUrl,
  githubAvatarUrl,
  extractMentionLogins,
} from '../shared/author.js';

describe('shared/author', () => {
  beforeEach(() => {
    clearAuthorCache();
  });

  it('manages author cache and expiration validity', () => {
    expect(getCachedAuthor()).toBeUndefined();
    expect(isCacheValid()).toBe(false);

    setCachedAuthor('octocat');
    expect(getCachedAuthor()).toBe('octocat');
    expect(isCacheValid()).toBe(true);

    clearAuthorCache();
    expect(getCachedAuthor()).toBeUndefined();
    expect(isCacheValid()).toBe(false);
  });

  it('resolves fallback author from environment variables or anonymous', () => {
    const origUser = process.env.USER;
    const origUsername = process.env.USERNAME;

    try {
      process.env.USER = 'dev-user';
      delete process.env.USERNAME;
      expect(fallbackAuthor()).toBe('dev-user');

      delete process.env.USER;
      process.env.USERNAME = 'win-user';
      expect(fallbackAuthor()).toBe('win-user');

      delete process.env.USER;
      delete process.env.USERNAME;
      expect(fallbackAuthor()).toBe('anonymous');
    } finally {
      if (origUser !== undefined) process.env.USER = origUser;
      if (origUsername !== undefined) process.env.USERNAME = origUsername;
    }
  });

  it('falls back to anonymous when global process is undefined or empty', () => {
    const origProcess = globalThis.process;
    try {
      (globalThis as any).process = undefined;
      expect(fallbackAuthor()).toBe('anonymous');
    } finally {
      globalThis.process = origProcess;
    }
  });

  it('validates github logins accurately', () => {
    expect(isGitHubLogin('octocat')).toBe(true);
    expect(isGitHubLogin('mona-lisa-123')).toBe(true);
    expect(isGitHubLogin('-invalid')).toBe(false);
    expect(isGitHubLogin('')).toBe(false);
    expect(isGitHubLogin('toolongusernameexceedingthelimitofthirtyninecharacters')).toBe(false);
  });

  it('generates profile and avatar URLs', () => {
    expect(githubProfileUrl('octocat')).toBe('https://github.com/octocat');
    expect(githubAvatarUrl('octocat')).toBe('https://avatars.githubusercontent.com/octocat?s=48');
    expect(githubAvatarUrl('octocat', 96)).toBe(
      'https://avatars.githubusercontent.com/octocat?s=96'
    );
  });

  it('extracts unique valid mention logins from text', () => {
    const text = 'Hey @octocat and @mona-lisa! What about @octocat and @-invalid and @someone?';
    const mentions = extractMentionLogins(text);
    expect(mentions).toContain('octocat');
    expect(mentions).toContain('mona-lisa');
    expect(mentions).toContain('someone');
    expect(mentions).not.toContain('-invalid');
    expect(mentions.length).toBe(3);
  });
});
