import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Icon Semantics & Differentiation Across All Interfaces (Option C)', () => {
  const readSource = (relPath: string) => fs.readFileSync(path.resolve(__dirname, relPath), 'utf8');

  const files = {
    vscode: '../vscode-extension/src/markdownItPlugin.ts',
    chrome: '../chrome-extension/src/content.ts',
    starlight: '../starlight-plugin/src/client/components/CommentsOverlay.ts',
    obsidian: '../obsidian-plugin/src/sidebarView.ts',
    demoHtml: '../website/demo-html/embed/md-comments.js',
    demoMock: '../website/demo-mock/embed/md-comments.js',
  };

  const extractIcon = (
    source: string,
    iconName: 'ICON_REFRESH' | 'ICON_RESOLVE' | 'ICON_REOPEN'
  ): string => {
    let match: RegExpMatchArray | null = null;
    if (iconName === 'ICON_REFRESH') {
      match = source.match(/const\s+ICON_REFRESH\s*=\s*[`']([\s\S]*?)[`'];/);
    } else if (iconName === 'ICON_RESOLVE') {
      match = source.match(/const\s+ICON_RESOLVE\s*=\s*[`']([\s\S]*?)[`'];/);
    } else if (iconName === 'ICON_REOPEN') {
      match = source.match(/const\s+ICON_REOPEN\s*=\s*[`']([\s\S]*?)[`'];/);
    }
    expect(match, `Could not find ${iconName} in source file`).not.toBeNull();
    return match![1].trim();
  };

  const CANONICAL_RELOAD_PATH = 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67';
  const CANONICAL_RESOLVE_CHECK_PATH = 'm9 12 2 2 4-4';
  const CANONICAL_REOPEN_MINUS_PATH = 'M8 12h8';

  for (const [key, filePath] of Object.entries(files)) {
    describe(`Surface: ${key} (${filePath})`, () => {
      const content = readSource(filePath);
      const iconRefresh = extractIcon(content, 'ICON_REFRESH');
      const iconResolve = extractIcon(content, 'ICON_RESOLVE');
      const iconReopen = extractIcon(content, 'ICON_REOPEN');

      it('ensures ICON_REFRESH, ICON_RESOLVE, and ICON_REOPEN are strictly pairwise distinct', () => {
        expect(iconRefresh).not.toEqual(iconReopen);
        expect(iconRefresh).not.toEqual(iconResolve);
        expect(iconResolve).not.toEqual(iconReopen);
      });

      it('verifies ICON_REFRESH uses canonical single-arrow clockwise reload path', () => {
        expect(iconRefresh).toContain(CANONICAL_RELOAD_PATH);
        expect(iconRefresh).toContain('viewBox="0 0 24 24"');
        // Ensure it is NOT the flawed double-arrow path
        expect(iconRefresh).not.toContain('M4 12a8');
      });

      it('verifies ICON_RESOLVE uses Check-Circle path (Option C)', () => {
        expect(iconResolve).toContain('circle cx="12" cy="12" r="9"');
        expect(iconResolve).toContain(CANONICAL_RESOLVE_CHECK_PATH);
        expect(iconResolve).toContain('viewBox="0 0 24 24"');
      });

      it('verifies ICON_REOPEN uses Circle-Minus path (Option C) and contains NO circular arrows', () => {
        expect(iconReopen).toContain('circle cx="12" cy="12" r="9"');
        expect(iconReopen).toContain(CANONICAL_REOPEN_MINUS_PATH);
        expect(iconReopen).toContain('viewBox="0 0 24 24"');
        // Ensure zero collision with any circular reload arrow
        expect(iconReopen).not.toContain('M21.5 2v6');
        expect(iconReopen).not.toContain('M4 12a8');
        expect(iconReopen).not.toContain('15.57a10');
      });
    });
  }

  it('guarantees VS Code extension refresh button no longer collides with thread reopen button', () => {
    const vscodeSource = readSource(files.vscode);
    const refreshMatch = vscodeSource.match(
      /id="md-comments-sidebar-refresh"[^>]*>\${ICON_REFRESH}/
    );
    expect(refreshMatch).not.toBeNull();

    const reopenMatch = vscodeSource.match(
      /actionIconBtn\('unresolve',\s*'Reopen thread',\s*ICON_REOPEN/
    );
    expect(reopenMatch).not.toBeNull();

    const iconRefresh = extractIcon(vscodeSource, 'ICON_REFRESH');
    const iconReopen = extractIcon(vscodeSource, 'ICON_REOPEN');
    expect(iconRefresh).not.toEqual(iconReopen);
  });
});
