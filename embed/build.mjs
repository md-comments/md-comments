#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(__dirname, 'dist');
const SRC = path.join(__dirname, 'src');

async function build() {
  console.log('[embed:build] Cleaning and preparing dist directory...');
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  console.log('[embed:build] Compiling TypeScript entrypoint & generating types...');
  await esbuild.build({
    entryPoints: [path.join(SRC, 'index.ts')],
    outfile: path.join(DIST, 'index.js'),
    format: 'esm',
    target: 'es2022',
    bundle: true,
    sourcemap: true,
  });

  execSync('npx tsc --emitDeclarationOnly -p tsconfig.json', {
    cwd: __dirname,
    stdio: 'inherit',
  });

  console.log('[embed:build] Bundling standalone runtime scripts...');
  // 1. Unminified standalone runtime
  await esbuild.build({
    entryPoints: [path.join(SRC, 'runtime.js')],
    outfile: path.join(DIST, 'md-comments.js'),
    format: 'iife',
    bundle: true,
    sourcemap: true,
    target: 'es2022',
  });

  // 2. Minified standalone runtime
  await esbuild.build({
    entryPoints: [path.join(SRC, 'runtime.js')],
    outfile: path.join(DIST, 'md-comments.min.js'),
    format: 'iife',
    bundle: true,
    minify: true,
    sourcemap: true,
    target: 'es2022',
  });

  console.log('[embed:build] Processing stylesheets...');
  const cssSource = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
  fs.writeFileSync(path.join(DIST, 'md-comments.css'), cssSource, 'utf8');

  const minifiedCss = await esbuild.transform(cssSource, {
    loader: 'css',
    minify: true,
    sourcemap: true,
  });
  fs.writeFileSync(path.join(DIST, 'md-comments.min.css'), minifiedCss.code, 'utf8');
  if (minifiedCss.map) {
    fs.writeFileSync(path.join(DIST, 'md-comments.min.css.map'), minifiedCss.map, 'utf8');
  }

  console.log('[embed:build] Syncing built bundles to website demo directories...');
  const websiteDemoTargets = [
    path.join(ROOT, 'website', 'demo-html', 'embed'),
    path.join(ROOT, 'website', 'demo-mock', 'embed'),
  ];

  for (const targetDir of websiteDemoTargets) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(
      path.join(DIST, 'md-comments.js'),
      path.join(targetDir, 'md-comments.js')
    );
    fs.copyFileSync(
      path.join(DIST, 'md-comments.css'),
      path.join(targetDir, 'md-comments.css')
    );
  }

  try {
    execSync(
      'npx prettier --write website/demo-html/embed/md-comments.js website/demo-mock/embed/md-comments.js website/demo-html/embed/md-comments.css website/demo-mock/embed/md-comments.css',
      { cwd: ROOT, stdio: 'ignore' }
    );
  } catch {
    /* ignore formatting errors */
  }

  console.log('[embed:build] Build complete. Artifacts in dist:');
  const files = fs.readdirSync(DIST);
  for (const f of files) {
    const stat = fs.statSync(path.join(DIST, f));
    console.log(`  - ${f} (${(stat.size / 1024).toFixed(1)} kB)`);
  }
}

build().catch((err) => {
  console.error('[embed:build] Build failed:', err);
  process.exit(1);
});
