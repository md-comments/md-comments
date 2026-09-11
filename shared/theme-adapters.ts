/**
 * Theme Adapters and WCAG Contrast Verification Utilities
 * Supports runtime theme normalization across GitHub, VS Code, and Demo sites.
 */

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

export const CANONICAL_DARK_THEME: ThemeColors = {
  bg: '#0d1117',
  surface: '#161b22',
  card: '#0d1117',
  border: '#30363d',
  textPrimary: '#c9d1d9',
  textSecondary: '#8b949e',
  accent: '#6366f1',
};

export const CANONICAL_LIGHT_THEME: ThemeColors = {
  bg: '#ffffff',
  surface: '#f6f8fa',
  card: '#ffffff',
  border: '#d0d7de',
  textPrimary: '#24292f',
  textSecondary: '#57606a',
  accent: '#4f46e5',
};

/**
 * Calculates luminance for an sRGB hex color (#rrggbb)
 */
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors (returns 1.0 to 21.0)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Resolves the theme class and data attributes for a given runtime environment
 */
export type RuntimeEnvironment = 'github' | 'vscode' | 'demo';

export function resolveThemeScope(
  env: RuntimeEnvironment,
  mode: 'dark' | 'light' = 'dark'
): { className: string; attributes: Record<string, string> } {
  switch (env) {
    case 'vscode':
      return {
        className: 'md-comments-scope md-comments-vscode-theme',
        attributes: { 'data-theme': mode },
      };
    case 'github':
      return {
        className: 'md-comments-scope',
        attributes: {
          'data-md-theme': mode,
          'data-color-mode': mode,
        },
      };
    case 'demo':
    default:
      return {
        className: 'md-comments-scope',
        attributes: { 'data-theme': mode },
      };
  }
}
