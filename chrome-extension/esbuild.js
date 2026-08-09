const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const prod = process.argv[2] === 'production';
const outdir = path.join(__dirname, 'dist');

function copyStaticFiles() {
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, { recursive: true });
  }

  // Copy manifest
  fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(outdir, 'manifest.json'));

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

  console.log('Static files copied to dist/');
}

const copyPlugin = {
  name: 'copy-plugin',
  setup(build) {
    build.onEnd(() => {
      copyStaticFiles();
    });
  },
};

async function main() {
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

  if (prod) {
    await context.rebuild();
    context.dispose();
  } else {
    await context.watch();
    console.log('Watching for changes...');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
