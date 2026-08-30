# Markdown Comments

[![FOSSA Status](https://app.fossa.com/api/projects/custom%2B63574%2Fgithub.com%2Fmd-comments%2Fmd-comments.svg?type=shield&issueType=license)](https://app.fossa.com/projects/custom%2B63574%2Fgithub.com%2Fmd-comments%2Fmd-comments?ref=badge_shield&issueType=license)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=md-comments.md-preview-comments)
[![Open VSX](https://img.shields.io/open-vsx/v/md-comments/md-preview-comments?label=Open%20VSX)](https://open-vsx.org/extension/md-comments/md-preview-comments)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/mjlhdjonjfcedkbpajkfeidfebefhkpp?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

🌐 **Website & Demo:** [md-comments.com](https://md-comments.com/)

> ### **AI-Orchestrated Docs. Human-Orchestrated Comments.**
>
> Docs live directly in your repository, and comments live as a native layer on top, never locked in third-party SaaS silos. AI agents orchestrate the documentation as code evolves, while humans orchestrate the reviews and discussions on rendered views.

Markdown and prose excel at authoring, version control, and agent workflows, but have lacked a built-in way to highlight passages and collaborate directly on rendered views. **Markdown Comments** provides a universal, zero-overhead commenting layer that works everywhere you read and review documentation.

Comments auto-save live via custom git refs (`refs/md-comments/data`) placed outside the standard `refs/heads/` branch namespace — requiring **zero commits, zero branches, and zero PR overhead**. Clean Markdown stays clean for AI tools and codebases, while humans get rich, real-time discussions across editors, documentation portals, and pull requests.

### 🌐 Comments Everywhere on Rendered Views

- **IDEs & Code Editors**: **VS Code** ([Marketplace](https://marketplace.visualstudio.com/items?itemName=md-comments.md-preview-comments) / [Open VSX](https://open-vsx.org/extension/md-comments/md-preview-comments)), **Cursor**, and **Antigravity**.
- **Documentation Sites & Frameworks**: **Astro & Starlight** ([@md-comments/starlight](https://www.npmjs.com/package/@md-comments/starlight)), HTML, Docusaurus, VitePress, Next.js, Hugo, and MkDocs.
- **Knowledge Bases**: **Obsidian** native plugin.
- **Pull Requests & Code Review**: **GitHub** ([Chrome Extension](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)).

---

## 🚀 Key Features

- **AI-Human Feedback Loop**: AI coding agents maintain repository documentation as code evolves, while human engineers leave structured feedback on rendered views. Agents can read comments via git refs to iterate on documents automatically.
- **Zero-Commit Custom Git Refs Backend**: All comments, replies, and reactions auto-save instantly via custom git refs (`refs/md-comments/data`) outside the standard branch namespace. Zero manual git commits, zero branch clutter, and zero SaaS database lock-in.
- **Zero Inline HTML Pollution**: Unlike legacy tools that inject `<!-- comment -->` tags into source markdown, Markdown Comments keeps `.md` files pristine for LLMs, linters, and static site generators.
- **Git Commit-Hashed Storage & Rollback Preservation**: Comment files are stored with the 7-character short commit SHA (`doc.<commit_sha>.comments.yml`). When checking out or rolling back a file to an earlier commit, page (footer) comments across revisions remain intact and aggregated (Confluence-style page rollback), while inline comments re-anchor to matching text in the active revision. Legacy `doc.comments.yml` files are automatically migrated upon write.
- **Fuzzy Anchoring Cascade**: Comments are robustly anchored across document revisions using a cascade matching strategy:
  1. **Paragraph Hash**: Exact match of the normalized FNV-1a hash of the text.
  2. **Fuzzy Text Match**: Selection-based substring search to identify the text even if slightly edited.
  3. **Heading + Paragraph Index**: Contextual paragraph offset within the closest heading.
- **Threaded Conversations & Emoji Reactions**: Support for nested replies, emoji reactions, and thread status (Open / Resolved) for page-level and text-selection comments.
- **Direct GitHub File & Line Linking**: Every comment entry contains clickable links back to the target file and line range (`docs/architecture.md#L15`).
- **Orphan Detection**: Detect and manage comments whose anchors are lost due to drastic document changes.
- **Zero-Extension Web Docs**: Embed in documentation sites with zero extensions required for readers via GitHub OAuth Device Flow.
- **OIDC & Trusted Publishing**: Automated npm releases with verifiable build provenance.

---

## 📂 Repository Structure (Monorepo)

This repository is organized as a monorepo separating editor-specific wrappers from shared logic:

- **[shared/](./shared/)**: Shared platform-independent core logic (parsing, fuzzy placement logic, avatar/author caching, and types).
- **[starlight-plugin/](./starlight-plugin/)**: Official Astro integration and Starlight plugin (`@md-comments/starlight`).
- **[vscode-extension/](./vscode-extension/)**: VS Code, Cursor, and Antigravity extension implementation.
- **[obsidian-plugin/](./obsidian-plugin/)**: Obsidian native plugin implementation.
- **[chrome-extension/](./chrome-extension/)**: Chrome Extension implementation for GitHub integration.

Refer to the respective folders for platform-specific documentation and configurations.

---

## 📥 Install

### VS Code / Cursor / Antigravity

Install directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=md-comments.md-preview-comments) or [Open VSX Registry](https://open-vsx.org/extension/md-comments/md-preview-comments).

Alternatively, download the latest `.vsix` from [GitHub Releases](https://github.com/md-comments/md-comments/releases), then install from the UI:

In your editor, open the **Extensions** view, click the **⋯** menu at the top-right, and select **Install from VSIX…**

Alternatively, install via CLI:

```bash
code --install-extension md-comments-<version>.vsix
# or in Cursor:
cursor --install-extension md-comments-<version>.vsix
```

### Obsidian

Manually copy the compiled `main.js`, `manifest.json`, and `styles.css` from the build output into your vault's plugin directory: `<vault-root>/.obsidian/plugins/md-comments/`. Enable it under **Settings** → **Community Plugins**.

### GitHub (Chrome Extension)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp).

Alternatively, to run the extension locally for development:

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top right.
3. Click the **Load unpacked** button in the top left and select the `chrome-extension/dist` folder in this repository.

---

## 💡 Usage

### VS Code / Cursor / Antigravity

1. Open a `.md` file.
2. Open the **Comments Side Panel** by clicking the comment icon in the Editor Title bar (top right) or running **Markdown Comments: Open Comment Preview** from the Command Palette (`Cmd/Ctrl+Shift+P`).
3. Select any text in the editor or preview, click **Comment** or **Add comment** to open the composer.
4. Comments auto-save to GitHub in real time via custom git refs (`refs/md-comments/data`) with zero commits on your source tree.
5. Review or manage orphaned comments by running **Markdown Comments: Scan for Orphaned Comments** from the Command Palette.

### Obsidian

1. Open any markdown file.
2. Toggle the **Comments Sidebar** using the message bubble icon in Obsidian's right sidebar ribbon, or run **Markdown Comments: Open Comments Sidebar** from the Command Palette (`Cmd/Ctrl+P`).
3. Select text in **Live Preview** or **Reading Mode**, right-click, and select **Add Comment to Selection** (or **Comment on Paragraph**). Alternatively, use the command palette command.
4. Replies and reactions can be added directly inside the sidebar.
5. Scan for broken/orphaned comments via the Command Palette command **Markdown Comments: Scan Active File for Orphaned Comments**.

### GitHub (Chrome Extension)

1. Navigate to any Pull Request containing Markdown files on GitHub.
2. The extension automatically adds a **Comments** tab to the PR navigation bar (renaming the native "Conversation" tab to "Code Review" for clarity).
3. Click the **Comments** tab to view the dedicated Markdown Comments workspace.
4. When viewing file diffs, hover over any Markdown paragraph to reveal the **+** (Add Comment) button next to it, or select a specific range of text to add an inline selection comment.
5. You can also click the floating message bubble icon in the bottom-right corner of the page to toggle the **Comments Sidebar** from any PR tab.
6. Compose your comment: comments auto-save instantly via custom git refs (`refs/md-comments/data`) with zero commits or branch overhead.
7. Read, reply to, and resolve comment threads directly from the sidebar or the Comments workspace tab.

---

## ⚙️ Settings

### VS Code

- `mdComments.sidebarWidth`: Default width of the comments side panel (260–600 px).
- `mdComments.reactionEmojis`: Emoji options for reactions.

### Obsidian

- **Author Name**: Your username displayed on comments and replies (falls back to Git configuration or system username if empty).
- **Reaction Emojis**: Available emojis for reactions.

### Chrome Extension

Configure via right-clicking the extension icon and selecting **Options**:

- **GitHub Token**: Fallback Personal Access Token (PAT) for API requests when rate-limited.
- **Conventional Commits**: Enable/disable Conventional Commits messages.
- **Commit Message Pattern**: Pattern used for commits (e.g. `docs(comments): {action}`).
- **Squash Commits**: Squash multiple local comment updates together.
- **Fixup Commits**: Use git `--fixup` flag when committing comment updates.
- **Batch Comments**: Buffer multiple comments together to perform a single commit.

---

## 🛠️ Development

Install dependencies at the root level to set up the workspace:

```bash
pnpm install
```

### Local Environment Setup

For local security and license compliance scans to pass, you must configure a FOSSA API key:

1. Create a `.env` file at the project root (this file is ignored by Git):
   ```env
   FOSSA_API_KEY=your_fossa_api_key_here
   ```
2. When running FOSSA scans locally, ensure the environment variables are loaded:
   ```bash
   # Load .env variables and run the scan
   export $(grep -v '^#' .env | xargs)
   fossa analyze
   ```

### Workspace Commands

Manage, build, and test the packages from the monorepo root:

```bash
# Build targets
pnpm build            # Builds VS Code, Obsidian, and Chrome Extension packages
pnpm build:vscode     # Compiles the VS Code extension
pnpm build:obsidian   # Compiles the Obsidian plugin
pnpm build:chrome     # Compiles the Chrome extension

# Watch / Development modes
pnpm watch:vscode     # Watch-builds the VS Code extension
pnpm watch:obsidian   # Watch-builds the Obsidian plugin (supports --outdir)
pnpm watch:chrome     # Watch-builds the Chrome extension

# Packaging
pnpm package:vscode   # Packages the VS Code extension into a .vsix file

# Quality Assurance & Testing
pnpm test             # Runs unit tests (Vitest)
pnpm test:watch       # Runs unit tests in watch mode
pnpm test:coverage    # Runs unit tests and outputs coverage reports
pnpm lint             # Lints code across the workspace (ESLint)
pnpm format           # Formats codebase (Prettier)
pnpm typecheck        # Checks types across all packages (TypeScript)
pnpm codegraph:status # Shows CodeGraph knowledge graph index status
```

### Running

- **VS Code**: Open `vscode-extension/` in a VS Code window and press **F5** to launch the Extension Development Host.
- **Obsidian**: Run the development watcher from the root and specify your vault's plugin directory:
  ```bash
  pnpm watch:obsidian --outdir="/path/to/vault/.obsidian/plugins/md-comments/"
  ```
- **Chrome Extension**: Build the extension or run the watcher, then load/reload the `chrome-extension/dist/` folder under `chrome://extensions/`:
  ```bash
  # Watch for extension changes
  pnpm watch:chrome
  ```

## 🔒 Security & Hardening Git Ref Access

Markdown Comments operates on custom Git references (`refs/md-comments/data`) stored outside standard branch namespaces (`refs/heads/*`). While GitHub App permissions for repository contents (`contents: write`) are repository-wide by default, you can restrict write access to protect source code branches:

### GitHub Repository Rulesets / Branch Protection

Protect your codebase branches while allowing Markdown Comments to synchronize comments:

1. In your GitHub repository, navigate to **Settings** → **Rules** → **Rulesets** (or **Branches**).
2. Create a ruleset targeting **All branches** (`refs/heads/**`) and **All tags** (`refs/tags/**`).
3. Enable **"Restrict creations"**, **"Restrict updates"**, **"Restrict deletions"**, and/or **"Require a pull request before merging"**.
4. Ensure the GitHub App / commenting token is **not** added to the **Bypass list**.

> [!TIP]
> Because `refs/md-comments/data` lives outside the `refs/heads/**` branch namespace, the app can freely record comment threads and reactions without any ability to directly push commits or alter source code branches.

## Privacy Policy

For details on how the Chrome Extension, VS Code Extension, and Obsidian Plugin handle user data, settings, and permissions, please refer to our [Privacy Policy](PRIVACY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
