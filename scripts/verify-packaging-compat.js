/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * verify-packaging-compat.js
 *
 * Validates that extension package manifests have compatible engine
 * and type declarations to prevent packaging failures in CI (e.g. vsce packaging).
 */

const fs = require('fs');
const path = require('path');

function parseMajorMinor(versionStr) {
  if (!versionStr) return null;
  const cleaned = versionStr.replace(/^[\^~>=<\s]+/, '');
  const parts = cleaned.split('.').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return null;
  }
  return { major: parts[0], minor: parts[1], raw: versionStr };
}

function verifyVsCodePackaging() {
  const vsCodePkgPath = path.resolve(__dirname, '../vscode-extension/package.json');
  if (!fs.existsSync(vsCodePkgPath)) {
    console.error(`[Packaging Guard] Missing vscode-extension/package.json`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(vsCodePkgPath, 'utf8'));
  const engineVersion = pkg.engines && pkg.engines.vscode;
  const typesVersion = pkg.devDependencies && pkg.devDependencies['@types/vscode'];

  if (!engineVersion || !typesVersion) {
    console.error(
      `[Packaging Guard] vscode-extension must declare both engines.vscode and devDependencies['@types/vscode'].`
    );
    process.exit(1);
  }

  const engineParsed = parseMajorMinor(engineVersion);
  const typesParsed = parseMajorMinor(typesVersion);

  if (!engineParsed || !typesParsed) {
    console.error(
      `[Packaging Guard] Failed to parse versions: engines=${engineVersion}, types=${typesVersion}`
    );
    process.exit(1);
  }

  if (
    typesParsed.major > engineParsed.major ||
    (typesParsed.major === engineParsed.major && typesParsed.minor > engineParsed.minor)
  ) {
    console.error(
      `[Packaging Guard] Incompatible versions detected in vscode-extension/package.json!\n` +
        `  engines.vscode:                 ${engineVersion} (v${engineParsed.major}.${engineParsed.minor})\n` +
        `  devDependencies[@types/vscode]: ${typesVersion} (v${typesParsed.major}.${typesParsed.minor})\n` +
        `vsce will fail packaging when @types/vscode is newer than engines.vscode.\n` +
        `Please pin @types/vscode to match engines.vscode: "^${engineParsed.major}.${engineParsed.minor}.0".`
    );
    process.exit(1);
  }
}

function verifyManifestsExist() {
  const requiredFiles = [
    'obsidian-plugin/manifest.json',
    'chrome-extension/manifest.json',
    'assets/icon.png',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.resolve(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Packaging Guard] Required extension file missing: ${relPath}`);
      process.exit(1);
    }
  }
}

function main() {
  verifyVsCodePackaging();
  verifyManifestsExist();
  console.log('[Packaging Guard] All packaging compatibility checks passed.');
}

main();
