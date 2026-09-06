/* eslint-disable security/detect-non-literal-fs-filename */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const prod = args.includes('production');
const targetArg = args.find((a) => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'all';

function copyStaticFiles(outdir, manifestSource) {
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, { recursive: true });
  }

  // Copy manifest
  const manifestPath = path.join(__dirname, manifestSource);
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(outdir, 'manifest.json'));
  }

  // Copy CSS styles
  const cssSrc = path.join(__dirname, 'src', 'sidebar.css');
  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, path.join(outdir, 'sidebar.css'));
  }

  // Copy icons
  const iconsSrcDir = path.join(__dirname, 'icons');
  const iconsDestDir = path.join(outdir, 'icons');
  if (fs.existsSync(iconsSrcDir)) {
    if (!fs.existsSync(iconsDestDir)) {
      fs.mkdirSync(iconsDestDir, { recursive: true });
    }
    const iconFiles = fs.readdirSync(iconsSrcDir);
    for (const file of iconFiles) {
      fs.copyFileSync(path.join(iconsSrcDir, file), path.join(iconsDestDir, file));
    }
  }

  console.log(`Static files copied to ${path.relative(__dirname, outdir)}/`);
}

async function buildTarget(outdir, manifestSource, isWatch) {
  const copyPlugin = {
    name: 'copy-plugin',
    setup(build) {
      build.onEnd(() => {
        copyStaticFiles(outdir, manifestSource);
      });
    },
  };

  const context = await esbuild.context({
    entryPoints: [
      path.join(__dirname, 'src', 'content.ts'),
      path.join(__dirname, 'src', 'background.ts'),
    ],
    bundle: true,
    outdir: outdir,
    format: 'iife',
    target: 'es2022',
    sourcemap: prod ? false : 'inline',
    treeShaking: true,
    plugins: [copyPlugin],
    logLevel: 'info',
  });

  if (isWatch) {
    await context.watch();
    console.log(`Watching for changes in ${path.relative(__dirname, outdir)}...`);
  } else {
    await context.rebuild();
    await context.dispose();
  }
}

async function main() {
  const isWatch = !prod && args.includes('--watch');

  if (target === 'chrome') {
    await buildTarget(
      path.join(__dirname, 'dist', 'chrome'),
      'manifests/manifest.chrome.json',
      isWatch
    );
    // Also sync to legacy dist/
    copyStaticFiles(path.join(__dirname, 'dist'), 'manifests/manifest.chrome.json');
  } else if (target === 'safari') {
    await buildTarget(
      path.join(__dirname, 'dist', 'safari'),
      'manifests/manifest.safari.json',
      isWatch
    );
  } else {
    // Build all targets
    console.log('Building all targets (Chrome & Safari)...');
    await buildTarget(
      path.join(__dirname, 'dist', 'chrome'),
      'manifests/manifest.chrome.json',
      false
    );
    await buildTarget(
      path.join(__dirname, 'dist', 'safari'),
      'manifests/manifest.safari.json',
      false
    );
    // Maintain standard dist/ for backward compatibility with root Playwright tests
    await buildTarget(path.join(__dirname, 'dist'), 'manifest.json', isWatch);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
