import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Embed Package Architecture, Exports & Distribution Integrity', () => {
  const EMBED_DIR = path.resolve(__dirname, '../embed');
  const DIST_DIR = path.join(EMBED_DIR, 'dist');
  const PKG_JSON_PATH = path.join(EMBED_DIR, 'package.json');

  it('declares valid package manifest with canonical exports and license', () => {
    expect(fs.existsSync(PKG_JSON_PATH)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(PKG_JSON_PATH, 'utf8'));

    expect(pkg.name).toBe('@md-comments/embed');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/);
    expect(pkg.license).toBe('MIT');
    expect(pkg.publishConfig?.access).toBe('public');
    expect(pkg.type).toBe('module');
    expect(pkg.main).toBe('./dist/index.js');
    expect(pkg.types).toBe('./dist/index.d.ts');

    expect(pkg.exports).toBeDefined();
    expect(pkg.exports['.']?.import).toBe('./dist/index.js');
    expect(pkg.exports['.']?.types).toBe('./dist/index.d.ts');
    expect(pkg.exports['./styles.css']).toBe('./dist/md-comments.css');
    expect(pkg.exports['./dist/md-comments.min.js']).toBe('./dist/md-comments.min.js');
    expect(pkg.exports['./dist/md-comments.js']).toBe('./dist/md-comments.js');
    expect(pkg.exports['./dist/md-comments.css']).toBe('./dist/md-comments.css');
    expect(pkg.exports['./dist/md-comments.min.css']).toBe('./dist/md-comments.min.css');
  });

  it('guarantees required distribution artifacts exist in dist/', () => {
    const requiredFiles = [
      'index.js',
      'index.d.ts',
      'md-comments.js',
      'md-comments.min.js',
      'md-comments.css',
      'md-comments.min.css',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(DIST_DIR, file);
      expect(fs.existsSync(fullPath), `Missing built artifact: ${file}`).toBe(true);
      const stats = fs.statSync(fullPath);
      expect(stats.size).toBeGreaterThan(100);
    }
  });

  it('satisfies bundle size performance budgets', () => {
    const jsMinStats = fs.statSync(path.join(DIST_DIR, 'md-comments.min.js'));
    const cssMinStats = fs.statSync(path.join(DIST_DIR, 'md-comments.min.css'));

    // Minified JS must be under 80 KB
    expect(jsMinStats.size).toBeLessThan(80 * 1024);
    // Minified CSS must be under 25 KB
    expect(cssMinStats.size).toBeLessThan(25 * 1024);
  });

  it('exports initMdComments and registers global options in browser runtime context', async () => {
    const mod = await import('../embed/dist/index.js');
    expect(typeof mod.initMdComments).toBe('function');
    expect(typeof mod.default).toBe('function');

    const fakeWindow: Record<string, unknown> = {};
    (globalThis as unknown as { window: unknown }).window = fakeWindow;

    mod.initMdComments({
      repo: 'test-org/test-repo',
      file: 'docs/guide.md',
      theme: 'dark',
    });

    expect(fakeWindow.__MD_COMMENTS_OPTIONS__).toEqual({
      repo: 'test-org/test-repo',
      file: 'docs/guide.md',
      theme: 'dark',
    });
  });
});
