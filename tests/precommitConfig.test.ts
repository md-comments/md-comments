import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Pre-Commit & CI Configuration Invariants', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('enforces --max-warnings=0 in package.json lint script', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.scripts.lint).toContain('--max-warnings=0');
  });

  it('includes verify:packaging and prepare hook setup in package.json', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.scripts['verify:packaging']).toBe('node scripts/verify-packaging-compat.js');
    expect(pkg.scripts.prepare).toContain('core.hooksPath .githooks');
    expect(pkg.scripts.check).toContain('pnpm verify:packaging');
  });

  it('verifies .eslintrc.json ignorePatterns covers all report and generated directories', () => {
    const eslintRcPath = path.join(rootDir, '.eslintrc.json');
    const eslintRc = JSON.parse(fs.readFileSync(eslintRcPath, 'utf8'));

    const requiredPatterns = [
      'dist',
      'out',
      'coverage',
      'playwright-report',
      'playwright-ci-report',
      'allure-results',
      'allure-report',
      'website/**/embed/**',
    ];

    for (const pattern of requiredPatterns) {
      expect(eslintRc.ignorePatterns).toContain(pattern);
    }
  });

  it('enforces that vscode-extension @types/vscode is compatible with engines.vscode', () => {
    const vsCodePkgPath = path.join(rootDir, 'vscode-extension', 'package.json');
    const vsCodePkg = JSON.parse(fs.readFileSync(vsCodePkgPath, 'utf8'));

    const engineVersion = vsCodePkg.engines?.vscode?.replace(/^[\^~>=<\s]+/, '');
    const typesVersion = vsCodePkg.devDependencies?.['@types/vscode']?.replace(/^[\^~>=<\s]+/, '');

    expect(engineVersion).toBeDefined();
    expect(typesVersion).toBeDefined();

    const [eMajor, eMinor] = engineVersion.split('.').map(Number);
    const [tMajor, tMinor] = typesVersion.split('.').map(Number);

    // @types/vscode must not exceed engines.vscode major or minor
    expect(tMajor).toBeLessThanOrEqual(eMajor);
    if (tMajor === eMajor) {
      expect(tMinor).toBeLessThanOrEqual(eMinor);
    }
  });

  it('verifies .githooks/pre-commit exists and contains strict verification steps', () => {
    const hookPath = path.join(rootDir, '.githooks', 'pre-commit');
    expect(fs.existsSync(hookPath)).toBe(true);

    const content = fs.readFileSync(hookPath, 'utf8');
    expect(content).toContain('verify-packaging-compat.js');
    expect(content).toContain('pnpm format:check');
    expect(content).toContain('pnpm lint');
    expect(content).toContain('pnpm typecheck');
    expect(content).toContain('pnpm test');
  });
});
