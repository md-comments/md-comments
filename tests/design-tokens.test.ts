import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getLuminance,
  getContrastRatio,
  CANONICAL_DARK_THEME,
  CANONICAL_LIGHT_THEME,
  resolveThemeScope,
} from '../shared/theme-adapters.js';

describe('Design Tokens & Theme Consistency Verification', () => {
  it('calculates relative luminance correctly for primary colors', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1.0, 2);
    expect(getLuminance('#000000')).toBeCloseTo(0.0, 2);
    expect(() => getLuminance('#abc')).toThrow('Invalid hex color');
  });

  it('verifies dark theme meets WCAG AA contrast ratio standards', () => {
    // Primary text vs background >= 4.5:1
    const primaryContrast = getContrastRatio(
      CANONICAL_DARK_THEME.textPrimary,
      CANONICAL_DARK_THEME.bg
    );
    expect(primaryContrast).toBeGreaterThanOrEqual(4.5);

    // Secondary text vs background >= 3.0:1
    const secondaryContrast = getContrastRatio(
      CANONICAL_DARK_THEME.textSecondary,
      CANONICAL_DARK_THEME.bg
    );
    expect(secondaryContrast).toBeGreaterThanOrEqual(3.0);
  });

  it('verifies light theme meets WCAG AA contrast ratio standards', () => {
    // Primary text vs background >= 4.5:1
    const primaryContrast = getContrastRatio(
      CANONICAL_LIGHT_THEME.textPrimary,
      CANONICAL_LIGHT_THEME.bg
    );
    expect(primaryContrast).toBeGreaterThanOrEqual(4.5);

    // Secondary text vs background >= 3.0:1
    const secondaryContrast = getContrastRatio(
      CANONICAL_LIGHT_THEME.textSecondary,
      CANONICAL_LIGHT_THEME.bg
    );
    expect(secondaryContrast).toBeGreaterThanOrEqual(3.0);
  });

  it('resolves theme scopes with appropriate class names and attributes', () => {
    const ghDark = resolveThemeScope('github');
    expect(ghDark.className).toContain('md-comments-scope');
    expect(ghDark.attributes['data-md-theme']).toBe('dark');
    expect(ghDark.attributes['data-color-mode']).toBe('dark');

    const vscodeTheme = resolveThemeScope('vscode', 'dark');
    expect(vscodeTheme.className).toContain('md-comments-vscode-theme');
    expect(vscodeTheme.attributes['data-theme']).toBe('dark');

    const demoLight = resolveThemeScope('demo', 'light');
    expect(demoLight.className).toContain('md-comments-scope');
    expect(demoLight.attributes['data-theme']).toBe('light');

    const defaultTheme = resolveThemeScope('custom' as any);
    expect(defaultTheme.className).toContain('md-comments-scope');
    expect(defaultTheme.attributes['data-theme']).toBe('dark');
  });

  it('validates canonical CSS files contain required design tokens and components', () => {
    const tokensCss = fs.readFileSync(
      path.resolve(__dirname, '../shared/styles/design-tokens.css'),
      'utf8'
    );
    expect(tokensCss).toContain('--mdc-font-family');
    expect(tokensCss).toContain('--mdc-drawer-width');
    expect(tokensCss).toContain('--mdc-fab-size');
    expect(tokensCss).toContain('--mdc-color-accent');
    expect(tokensCss).toContain('--mdc-color-bg');
    expect(tokensCss).toContain('.md-comments-vscode-theme');

    const componentsCss = fs.readFileSync(
      path.resolve(__dirname, '../shared/styles/components.css'),
      'utf8'
    );
    expect(componentsCss).toContain('.mdc-fab-toggle');
    expect(componentsCss).toContain('.mdc-drawer');
    expect(componentsCss).toContain('.mdc-comment-card');
    expect(componentsCss).toContain('.mdc-composer');
    expect(componentsCss).toContain('.mdc-reaction-bar');
    expect(componentsCss).toContain('.mdc-anchor-highlight');
  });
});
