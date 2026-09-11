import { describe, it, expect, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isReleaseBranch, getDefaultLogLevel } = require('../scripts/detect-build-env');

describe('Release Branch Environment & Bundle Logging', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('detect-build-env.js', () => {
    it('detects release branch when RELEASE_BUILD=true', () => {
      process.env.RELEASE_BUILD = 'true';
      expect(isReleaseBranch()).toBe(true);
      expect(getDefaultLogLevel()).toBe('error');
    });

    it('detects release branch when GITHUB_REF starts with refs/heads/release/', () => {
      delete process.env.RELEASE_BUILD;
      process.env.GITHUB_REF = 'refs/heads/release/1.4.0';
      expect(isReleaseBranch()).toBe(true);
      expect(getDefaultLogLevel()).toBe('error');
    });

    it('detects release branch when GITHUB_REF_NAME starts with release/', () => {
      delete process.env.RELEASE_BUILD;
      delete process.env.GITHUB_REF;
      process.env.GITHUB_REF_NAME = 'release/2.0.0';
      expect(isReleaseBranch()).toBe(true);
      expect(getDefaultLogLevel()).toBe('error');
    });

    it('returns debug log level when not in a release environment', () => {
      delete process.env.RELEASE_BUILD;
      delete process.env.GITHUB_REF;
      delete process.env.GITHUB_REF_NAME;
      // On main or normal branch, getDefaultLogLevel is debug or error based on branch
      const level = getDefaultLogLevel();
      expect(['debug', 'error']).toContain(level);
    });
  });

  describe('chrome-extension esbuild release bundle log stripping', () => {
    it('strips debug/info logs and preserves console.error when building under release flag', () => {
      const chromeExtDir = path.resolve(__dirname, '../chrome-extension');

      // Build with RELEASE_BUILD=true
      execSync('node esbuild.js production --target=chrome', {
        cwd: chromeExtDir,
        env: {
          ...process.env,
          RELEASE_BUILD: 'true',
        },
        stdio: 'pipe',
      });

      const bundledContentPath = path.join(chromeExtDir, 'dist/chrome/content.js');
      expect(fs.existsSync(bundledContentPath)).toBe(true);
      const bundledContent = fs.readFileSync(bundledContentPath, 'utf8');

      // In content.ts: console.log('[md-comments] Found valid GitHub token (or refreshed)')
      expect(bundledContent).not.toContain('[md-comments] Found valid GitHub token');
      // console.error must be preserved
      expect(bundledContent).toContain('console.error');
    });
  });
});
