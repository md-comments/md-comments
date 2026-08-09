# Markdown Comments — Obsidian Plugin

An Obsidian plugin that brings inline commenting to Markdown files, powered by custom git refs (`refs/md-comments/data`).

Comments are stored directly on GitHub via dedicated orphan git references (`refs/md-comments/data`), enabling zero-commit, zero-PR collaboration across your notes.

---

## Features

- **Inline Highlights & Comments**: Works in both **Reading View** (via post-processor) and **Editing/Live Preview Mode** (via CodeMirror 6 plugin).
- **Custom Sidebar**: Dedicated right sidebar tab displaying Page comments, Inline comments, Resolved comments, and Orphaned comments.
- **Custom Git Refs Backend**: Auto-saves comments to GitHub without cluttering your Git repository tree, requiring zero commits or PR overhead.
- **Emoji Reactions & Thread Replies**: Fully supports threaded replies and toggleable emoji reaction chips.
- **Theme Native**: Integrates with standard Obsidian CSS theme variables to fit perfectly with light, dark, or custom themes.

---

## Installation

Since this plugin is in active development, you can install it manually:

1. Create a folder named `md-comments` in your vault's plugin directory:
   `<your-vault>/.obsidian/plugins/md-comments/`
2. Build the plugin (see below) and copy the following files into that folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Open Obsidian, go to **Settings** → **Community Plugins**, and toggle **Markdown Comments** on.

---

## Development & Build Instructions

Ensure you have Node.js and `pnpm` installed.

### 1. Install Dependencies

```bash
cd obsidian-plugin
pnpm install
```

### 2. Build for Production

Creates a minified local build of `main.js`:

```bash
pnpm run build
```

---

## Debugging inside Obsidian

Obsidian runs on Electron, which means it has a full Chrome Developer Tools interface!

### 1. Watch & Compile Directly to Your Vault

Run `esbuild` in watcher mode and pass your Obsidian vault's plugin directory as the `--outdir` parameter. This automatically compiles and copies `main.js`, `manifest.json`, and `styles.css` whenever you modify source files:

```bash
node esbuild.config.mjs --outdir="/Users/username/Documents/ObsidianVault/.obsidian/plugins/md-comments/"
```

### 2. Open Developer Tools

Press `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux) inside Obsidian. This opens the DevTools drawer:

- **Console Tab**: View output logs, warnings, and errors.
- **Sources Tab**: Inspect files. Source Maps are inlined during development watch builds, allowing you to place breakpoints directly in your TypeScript source files (`livePreview.ts`, `sidebarView.ts`, etc.) instead of the bundled `main.js`!
- **Elements Tab**: Inspect the DOM structure of your note previews and the sidebar to adjust styles.

### 3. Hot Reloading

To quickly see your changes in Obsidian without restarting the app:

- Install the **Hot Reload** community developer plugin (reloads plugins automatically when `main.js` changes on disk).
- Or, manually toggle the plugin **Off and On** under **Settings** → **Community Plugins**.
