import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VS Code Panel Toggle Icon Parity with FAB', () => {
  const rootDir = path.resolve(__dirname, '..');
  const pkgPath = path.join(rootDir, 'vscode-extension', 'package.json');
  const iconsDir = path.join(rootDir, 'vscode-extension', 'media', 'icons');
  const darkIconPath = path.join(iconsDir, 'comment-preview-dark.svg');
  const lightIconPath = path.join(iconsDir, 'comment-preview-light.svg');

  it('verifies package.json contributes custom SVG icons instead of generic codicons', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const commands: Array<{ command: string; title: string; icon?: unknown }> =
      pkg.contributes?.commands ?? [];

    const toggleCmd = commands.find((c) => c.command === 'mdComments.toggleCommentPreview');
    expect(toggleCmd).toBeDefined();
    expect(toggleCmd?.icon).toEqual({
      light: './media/icons/comment-preview-light.svg',
      dark: './media/icons/comment-preview-dark.svg',
    });

    const openCmd = commands.find((c) => c.command === 'mdComments.openCommentPreview');
    expect(openCmd).toBeDefined();
    expect(openCmd?.icon).toEqual({
      light: './media/icons/comment-preview-light.svg',
      dark: './media/icons/comment-preview-dark.svg',
    });

    // Ensure generic codicon is eliminated
    const allIcons = JSON.stringify(pkg.contributes?.commands ?? {});
    expect(allIcons).not.toContain('$(comment-discussion)');
  });

  it('ensures dark and light icon SVG files exist on disk', () => {
    expect(fs.existsSync(darkIconPath)).toBe(true);
    expect(fs.existsSync(lightIconPath)).toBe(true);
  });

  it('validates SVG structure, viewBox, and canonical FAB brand geometry in comment-preview-dark.svg', () => {
    const content = fs.readFileSync(darkIconPath, 'utf8');

    expect(content).toContain('viewBox="0 0 512 512"');
    expect(content).toContain('fill-rule="evenodd"');
    expect(content).toContain('fill="#c5c5c5"');

    // Canonical speech bubble outer boundary
    expect(content).toContain(
      'M 136 64\n       L 376 64\n       C 424 64 456 96 456 144\n       L 456 304\n       C 456 352 424 384 376 384\n       L 216 384\n       C 184 384 150 404 126 428\n       C 118 436 104 430 104 418\n       L 104 384\n       C 72 380 56 352 56 304\n       L 56 144\n       C 56 96 88 64 136 64 Z'
    );

    // Canonical "M" letter knockout
    expect(content).toContain('M 132 168');
    // Canonical "D" letter knockout
    expect(content).toContain('M 276 168');
    expect(content).toContain('M 302 192');
  });

  it('validates SVG structure, viewBox, and canonical FAB brand geometry in comment-preview-light.svg', () => {
    const content = fs.readFileSync(lightIconPath, 'utf8');

    expect(content).toContain('viewBox="0 0 512 512"');
    expect(content).toContain('fill-rule="evenodd"');
    expect(content).toContain('fill="#424242"');

    // Canonical speech bubble outer boundary
    expect(content).toContain(
      'M 136 64\n       L 376 64\n       C 424 64 456 96 456 144\n       L 456 304\n       C 456 352 424 384 376 384\n       L 216 384\n       C 184 384 150 404 126 428\n       C 118 436 104 430 104 418\n       L 104 384\n       C 72 380 56 352 56 304\n       L 56 144\n       C 56 96 88 64 136 64 Z'
    );

    // Canonical "M" letter knockout
    expect(content).toContain('M 132 168');
    // Canonical "D" letter knockout
    expect(content).toContain('M 276 168');
    expect(content).toContain('M 302 192');
  });

  it('guarantees exact geometric parity with canonical assets/icon.svg', () => {
    const assetIconPath = path.join(rootDir, 'assets', 'icon.svg');
    expect(fs.existsSync(assetIconPath)).toBe(true);
    const assetContent = fs.readFileSync(assetIconPath, 'utf8');

    const extractPathD = (svg: string) => {
      const match = svg.match(/d="([^"]+)"/);
      expect(match).not.toBeNull();
      return match![1].replace(/\s+/g, ' ').trim();
    };

    const assetD = extractPathD(assetContent);
    const darkD = extractPathD(fs.readFileSync(darkIconPath, 'utf8'));
    const lightD = extractPathD(fs.readFileSync(lightIconPath, 'utf8'));

    expect(darkD).toEqual(assetD);
    expect(lightD).toEqual(assetD);
  });
});
