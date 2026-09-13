#!/usr/bin/env node

/**
 * Architecture Assets Generator
 *
 * Compiles:
 * 1. D2 diagrams (DFD L0, L1, L2, Component Integration) to SVGs using the ELK engine
 * 2. LikeC4 views to vector SVGs via D2 codegen
 * 3. Interactive LikeC4 application with pan/zoom drill-down navigation
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const d2OutputDir = path.join(rootDir, 'website/assets/architecture/d2');
const c4OutputDir = path.join(rootDir, 'website/assets/architecture/c4');
const interactiveOutputDir = path.join(rootDir, 'website/assets/architecture/interactive');
const tempC4D2Dir = path.join(rootDir, '.temp-c4-d2');

console.log('\n==> Generating Architecture Diagram Assets & Interactive Explorer...\n');

// Ensure output directories exist
fs.mkdirSync(d2OutputDir, { recursive: true });
fs.mkdirSync(c4OutputDir, { recursive: true });
fs.mkdirSync(interactiveOutputDir, { recursive: true });

// 1. Compile D2 Data Flow & Integration Diagrams
const d2Sources = [
  { src: 'docs/architecture/dfd/dfd-level-0-context.d2', out: 'dfd-level-0-context.svg' },
  { src: 'docs/architecture/dfd/dfd-level-1-subsystems.d2', out: 'dfd-level-1-subsystems.svg' },
  { src: 'docs/architecture/dfd/dfd-level-2-storage.d2', out: 'dfd-level-2-storage.svg' },
  { src: 'docs/architecture/components-integration.d2', out: 'components-integration.svg' },
];

for (const { src, out } of d2Sources) {
  const fullSrc = path.join(rootDir, src);
  const fullOut = path.join(d2OutputDir, out);
  console.log(`Compiling D2 (ELK): ${src} -> ${out}`);
  execSync(`d2 --layout=elk --theme=200 "${fullSrc}" "${fullOut}"`, {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

// 2. Generate C4 View SVGs via LikeC4 D2 codegen
console.log('\nGenerating D2 sources from LikeC4...');
if (fs.existsSync(tempC4D2Dir)) {
  fs.rmSync(tempC4D2Dir, { recursive: true, force: true });
}
execSync(`npx likec4 gen d2 -o "${tempC4D2Dir}" docs/architecture/c4`, {
  cwd: rootDir,
  stdio: 'inherit',
});

const c4Views = [
  'systemContext',
  'containers',
  'vscodeInternals',
  'previewInternals',
  'sharedInternals',
  'browserInternals',
  'obsidianInternals',
  'starlightInternals',
];

for (const view of c4Views) {
  const d2File = path.join(tempC4D2Dir, `${view}.d2`);
  const svgFile = path.join(c4OutputDir, `${view}.svg`);
  if (fs.existsSync(d2File)) {
    console.log(`Compiling C4 SVG: ${view}.d2 -> ${view}.svg`);
    execSync(`d2 --layout=elk --theme=200 "${d2File}" "${svgFile}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
  }
}

// Clean up temporary D2 files
if (fs.existsSync(tempC4D2Dir)) {
  fs.rmSync(tempC4D2Dir, { recursive: true, force: true });
}

// 3. Build Interactive LikeC4 Single-Page Application
console.log('\nBuilding Interactive LikeC4 Single-Page Application...');
execSync(`npx likec4 build -o "${interactiveOutputDir}" docs/architecture/c4 --use-hash-history --base ./`, {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('\n\x1b[32m✔ All architecture diagrams and interactive explorer generated successfully!\x1b[0m\n');
