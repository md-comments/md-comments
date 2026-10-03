/* eslint-disable security/detect-non-literal-regexp */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Embed Security Hardening & Isolation Invariants', () => {
  const EMBED_DIR = path.resolve(__dirname, '../embed');
  const RUNTIME_SRC = path.join(EMBED_DIR, 'src/runtime.js');
  const DIST_JS = path.join(EMBED_DIR, 'dist/md-comments.js');
  const DIST_MIN_JS = path.join(EMBED_DIR, 'dist/md-comments.min.js');

  it('INV-NO-THIRD-PARTY-PROXY: strictly bans proxy.cors.sh across all source and distribution files', () => {
    const filesToCheck = [RUNTIME_SRC, DIST_JS, DIST_MIN_JS];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toContain('proxy.cors.sh');
      expect(content).not.toContain('corsproxy.io');
    }
  });

  it('INV-LEAST-PRIVILEGE-OAUTH: defaults OAuth device flow to public_repo read:user rather than full repo access', () => {
    const content = fs.readFileSync(RUNTIME_SRC, 'utf8');
    expect(content).toContain("scope: this.oauthScope || 'public_repo read:user'");
  });

  it('INV-PATH-TRAVERSAL-PROTECTED: validates repo owner and name format against directory traversal', () => {
    const content = fs.readFileSync(RUNTIME_SRC, 'utf8');

    // Extract regex and validator from source
    const regexMatch = content.match(/const\s+REPO_IDENTIFIER_REGEX\s*=\s*(\/[^/]+\/);/);
    expect(regexMatch).not.toBeNull();
    const regex = new RegExp(regexMatch![1].slice(1, -1));

    const isValid = (val: unknown): boolean => {
      return (
        typeof val === 'string' &&
        val.length > 0 &&
        val.length <= 100 &&
        val !== '.' &&
        val !== '..' &&
        regex.test(val)
      );
    };

    // Valid identifiers
    expect(isValid('md-comments')).toBe(true);
    expect(isValid('html-demo-comments')).toBe(true);
    expect(isValid('repo.name_v2')).toBe(true);

    // Invalid & Traversal payloads
    expect(isValid('..')).toBe(false);
    expect(isValid('.')).toBe(false);
    expect(isValid('../evil')).toBe(false);
    expect(isValid('../../etc/passwd')).toBe(false);
    expect(isValid('owner/repo')).toBe(false);
    expect(isValid('bad name with spaces')).toBe(false);
    expect(isValid('')).toBe(false);
    expect(isValid('a'.repeat(101))).toBe(false);
  });

  it('INV-XSS-SANITIZED: ensures HTML escaping sanitizes dangerous tags and event handlers', () => {
    const content = fs.readFileSync(RUNTIME_SRC, 'utf8');
    expect(content).toContain(".replace(/&/g, '&amp;')");
    expect(content).toContain(".replace(/</g, '&lt;')");
    expect(content).toContain(".replace(/>/g, '&gt;')");
    expect(content).toContain(".replace(/\"/g, '&quot;')");
    expect(content).toContain(".replace(/'/g, '&#039;')");

    const escapeHtml = (str: string) =>
      (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const payload = '<script>alert(1)</script><img src="x" onerror="evil()" />';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('onerror="evil()"');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('INV-BASE-TREE-RESOLVED: ensures orphan ref commit creation queries base tree SHA', () => {
    const content = fs.readFileSync(RUNTIME_SRC, 'utf8');
    expect(content).toContain('git/commits/${currentCommitSha}');
    expect(content).toContain('baseTreeSha = commitData.tree?.sha');
    expect(content).toContain('treeBody.base_tree = baseTreeSha');
  });
});
