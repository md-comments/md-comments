const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Helper to copy file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
}

// Helper to copy directory contents
function copyDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    return;
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(
        `Copied: ${path.relative(rootDir, srcPath)} -> ${path.relative(rootDir, destPath)}`
      );
    }
  }
}

// 1. Copy VS Code extension icon
const vscodeSrc = path.join(rootDir, 'assets', 'icon.png');
const vscodeDest = path.join(rootDir, 'vscode-extension', 'icon.png');
if (fs.existsSync(vscodeSrc)) {
  copyFile(vscodeSrc, vscodeDest);
} else {
  console.error(`VS Code icon source not found at: ${vscodeSrc}`);
}

// 2. Copy Chrome extension icons
const chromeSrcDir = path.join(rootDir, 'assets', 'chrome-extension');
const chromeDestDir = path.join(rootDir, 'chrome-extension', 'icons');
if (fs.existsSync(chromeSrcDir)) {
  copyDirectory(chromeSrcDir, chromeDestDir);
} else {
  console.error(`Chrome extension icons source not found at: ${chromeSrcDir}`);
}

console.log('Icon consolidation copy completed.');
