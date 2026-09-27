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
    'safari-extension/HOW-TO-OPEN.txt',
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

function verifySafariPackaging() {
  const chromePkgPath = path.resolve(__dirname, '../chrome-extension/package.json');
  const chromePkg = JSON.parse(fs.readFileSync(chromePkgPath, 'utf8'));
  const targetVersion = chromePkg.version;

  const safariManifestPath = path.resolve(
    __dirname,
    '../chrome-extension/manifests/manifest.safari.json'
  );
  if (fs.existsSync(safariManifestPath)) {
    const safariManifest = JSON.parse(fs.readFileSync(safariManifestPath, 'utf8'));
    if (safariManifest.version !== targetVersion) {
      console.error(
        `[Packaging Guard] Version mismatch in chrome-extension/manifests/manifest.safari.json: ` +
          `expected ${targetVersion}, found ${safariManifest.version}`
      );
      process.exit(1);
    }
  }

  const plistPaths = [
    'safari-extension/src/App/Info.plist',
    'safari-extension/src/Extension/Info.plist',
  ];
  for (const rel of plistPaths) {
    const full = path.resolve(__dirname, '..', rel);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      const m = content.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
      if (!m || m[1] !== targetVersion) {
        console.error(
          `[Packaging Guard] Version mismatch in ${rel}: expected ${targetVersion}, found ${m ? m[1] : 'unknown'}`
        );
        process.exit(1);
      }
    }
  }

  const builtManifestPath = path.resolve(
    __dirname,
    '../safari-extension/build/Markdown Comments.app/Contents/PlugIns/Markdown Comments Extension.appex/Contents/Resources/manifest.json'
  );
  if (fs.existsSync(builtManifestPath)) {
    const builtManifest = JSON.parse(fs.readFileSync(builtManifestPath, 'utf8'));
    if (builtManifest.version !== targetVersion) {
      console.error(
        `[Packaging Guard] Stale Safari build detected in safari-extension/build! ` +
          `Manifest is at v${builtManifest.version}, but repo is at v${targetVersion}. ` +
          `Please run: pnpm run build:safari`
      );
      process.exit(1);
    }
  }
}

function main() {
  verifyVsCodePackaging();
  verifyManifestsExist();
  verifySafariPackaging();
  console.log('[Packaging Guard] All packaging compatibility checks passed.');
}

main();
