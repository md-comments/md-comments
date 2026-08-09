# Markdown Comments for VS Code

Bring rich inline commenting to Markdown files directly inside VS Code, Cursor, or Antigravity, powered by GitHub as the primary backend.

All comments, replies, and reactions are stored directly on GitHub (in dedicated orphan git references `refs/md-comments/data`), requiring **zero commits, zero branches, and zero PR overhead** in your workspace codebase.

---

## Key Features

- **Inline Highlights & Comments**: Leave comments on specific text selections or paragraphs.
- **Custom Git Refs Backend**: Comments auto-save live to GitHub (`refs/md-comments/data`) with zero commits or branch overhead.
- **Fuzzy Anchoring Cascade**: Comments are robustly anchored using a cascade matching strategy:
  1. **Paragraph Hash**: Exact match of the normalized FNV-1a hash of the text.
  2. **Fuzzy Text Match**: Selection-based substring search to identify the text even if slightly edited.
  3. **Heading + Paragraph Index**: Contextual paragraph offset within the closest heading.
- **Threaded Conversations**: Support for nested replies, emoji reactions, and thread status (Open / Resolved) for page-level and text-selection comments.
- **Git/GitHub Integration**: Resolves local Git/GitHub configuration to display actual GitHub display names and avatars. Mentions using `@username` link to GitHub profiles.
- **Code Lens Integration**: See comment counts directly inline above your Markdown paragraphs. Click the lens to open the comments panel.
- **Orphan Detection**: Detect and manage comments whose anchors are lost due to drastic document changes.

---

## Installation

### From VS Code Marketplace / Open VSX

Search for **MD-Comments** in the VS Code Extensions view and click install.

### From VSIX

Download the latest `.vsix` from [GitHub Releases](https://github.com/md-comments/md-comments/releases), then install from the UI:

1. Open the **Extensions** view (`Cmd+Shift+X` or `Ctrl+Shift+X`).
2. Click the **⋯** (Views and More Actions) menu at the top-right.
3. Select **Install from VSIX…** and choose the downloaded file.

Alternatively, install via CLI:

```bash
code --install-extension md-comments-<version>.vsix
# or in Cursor:
cursor --install-extension md-comments-<version>.vsix
```

---

## Usage

1. Open any Markdown (`.md`) file.
2. Click the **Comment Icon** (💬) in the editor title menu (top-right), or open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for **Markdown Comments: Open Comment Preview**.
3. Select any text in the editor, click the **Add comment** button in the sidebar (or use editor hover actions) to start a new discussion.
4. Replies and emoji reactions can be managed directly in the preview sidebar.
5. Comments auto-save live to the GitHub backend in real time via custom git refs.
6. If paragraphs are drastically edited, comments might become "orphaned". You can scan for them by running **Markdown Comments: Scan for Orphaned Comments** from the Command Palette.

---

## Commands

The extension registers the following commands:

- `mdComments.openCommentPreview` (**Markdown Comments: Open Comment Preview**): Opens the comments panel next to your active Markdown editor.
- `mdComments.scanOrphans` (**Markdown Comments: Scan for Orphaned Comments**): Scans the active document for comments whose anchors no longer match the text and marks them as orphaned.
- `mdComments.refreshPreview`: Refreshes the comment preview panel.

---

## Settings

Customize the extension's behavior in your VS Code settings:

- `mdComments.sidebarWidth`: Default width of the comments side panel in pixels (default: `340`, min: `260`, max: `600`).
- `mdComments.reactionEmojis`: List of emoji options for comment reactions (default: `["👍", "👀", "❤️", "🎉", "❓"]`).

---

## License

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.
