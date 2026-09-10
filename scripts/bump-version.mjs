#!/usr/bin/env node
/**
 * scripts/bump-version.mjs
 *
 * Deterministically updates version strings across all manifest files,
 * package.json files, Plists, telemetry modules, and workflows for md-comments.
 *
 * Usage:
 *   node scripts/bump-version.mjs <new-version>
 *   pnpm run version:bump <new-version>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const targetVersion = process.argv[2];

if (!targetVersion) {
  console.error('Usage: node scripts/bump-version.mjs <target-version>');
  console.error('Example: node scripts/bump-version.mjs 1.3.2');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(targetVersion)) {
  console.error(`Error: Invalid semver version string: "${targetVersion}"`);
  process.exit(1);
}

console.log(`Bumping repository to version: ${targetVersion}`);

function updateFile(relPath, transformFn) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`[WARN] File not found: ${relPath}`);
    return;
  }
  const original = fs.readFileSync(absPath, 'utf8');
  const updated = transformFn(original);
  if (original !== updated) {
    fs.writeFileSync(absPath, updated, 'utf8');
    console.log(`✓ Updated: ${relPath}`);
  } else {
    console.log(`- Unchanged (already current): ${relPath}`);
  }
}

function updateJsonVersion(relPath) {
  updateFile(relPath, (content) => {
    return content.replace(
      /("version":\s*")[^"]+(")/,
      `$1${targetVersion}$2`
    );
  });
}

function updatePlistVersion(relPath) {
  updateFile(relPath, (content) => {
    return content.replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/g,
      `$1${targetVersion}$2`
    );
  });
}

function updateTelemetryServiceVersion(relPath) {
  updateFile(relPath, (content) => {
    return content.replace(
      /(serviceVersion:\s*['"])[^'"]+(['"])/g,
      `$1${targetVersion}$2`
    );
  });
}

// 1. JSON Package & Manifest Files
updateJsonVersion('vscode-extension/package.json');
updateJsonVersion('chrome-extension/package.json');
updateJsonVersion('chrome-extension/manifest.json');
updateJsonVersion('chrome-extension/manifests/manifest.chrome.json');
updateJsonVersion('chrome-extension/manifests/manifest.safari.json');
updateJsonVersion('obsidian-plugin/package.json');
updateJsonVersion('obsidian-plugin/manifest.json');
updateJsonVersion('shared/package.json');
updateJsonVersion('starlight-plugin/package.json');

// 2. Safari Plist Files
updatePlistVersion('safari-extension/src/App/Info.plist');
updatePlistVersion('safari-extension/src/Extension/Info.plist');

// 3. Telemetry Service Versions
updateTelemetryServiceVersion('chrome-extension/src/telemetry/contentTelemetry.ts');
updateTelemetryServiceVersion('chrome-extension/src/telemetry/otelBackground.ts');
updateTelemetryServiceVersion('obsidian-plugin/src/telemetry.ts');
updateTelemetryServiceVersion('vscode-extension/src/telemetry/ideTelemetry.ts');
updateTelemetryServiceVersion('tests/sharedTelemetry.test.ts');

// 4. GitHub Actions Default Service Version
updateFile('.github/workflows/telemetry-alert-triage.yml', (content) => {
  return content.replace(
    /(description:\s*'Application Release Version'[\s\S]*?default:\s*')[^']+(')/g,
    `$1${targetVersion}$2`
  );
});

// 5. Website Safari DMG download link
updateFile('website/index.html', (content) => {
  return content.replace(
    /(href="https:\/\/github\.com\/md-comments\/md-comments\/releases\/download\/v)[^/]+(\/Markdown-Comments-macOS\.dmg")/g,
    `$1${targetVersion}$2`
  );
});

console.log(`\nAll files updated to version ${targetVersion} successfully.`);
