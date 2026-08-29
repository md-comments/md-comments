# Astro & Starlight Plugin (`@md-comments/starlight`)

> ### **AI-Orchestrated Docs. Human-Orchestrated Comments.**
>
> Docs live directly in your repository, and comments live as a native layer on top, never locked in third-party SaaS silos. AI agents orchestrate the documentation as code evolves, while humans orchestrate the reviews and discussions on rendered views.

The `@md-comments/starlight` package provides an official Astro integration and Starlight plugin to bring the Markdown Comments system directly to documentation websites and blogs—**with zero browser extensions and zero SaaS subscription silos**.

---

## Features

- 💬 **Inline Discussions on Rendered Prose**: Readers and team members can highlight any sentence or paragraph in documentation to leave comments or view discussion threads.
- 🤖 **AI-Agent Ready**: Keeps repository Markdown source 100% free of inline HTML comment pollution, allowing AI coding assistants to cleanly read, maintain, and generate documentation.
- 📌 **Gutter Pins & Count Badges**: Floating margin badges show active comment threads next to paragraphs.
- ⚡ **Zero-Extension / Zero-Server Client**: Works entirely in the browser using the **GitHub OAuth Device Flow** and direct GitHub API calls. Public documentation reads require **no login**.
- 🔄 **100% Cross-Platform Compatibility**: Uses the same `refs/md-comments/data` Git ref backend and FNV-1a hashing as the **VS Code / Cursor / Antigravity Extension**, **Obsidian Plugin**, and **Chrome Extension**.
- 🎨 **Native Starlight Theming**: Respects light/dark modes and CSS custom properties (`--sl-color-*`).
- 🔐 **OIDC Trusted Publishing**: Distributed via npm with verifiable cryptographic build provenance.

---

## Installation

```bash
pnpm add @md-comments/starlight
# or
npm install @md-comments/starlight
```

---

## Quickstart

### 1. Configure in `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { starlightMdComments } from '@md-comments/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Project Documentation',
      plugins: [
        starlightMdComments({
          // GitHub repository where comments are stored
          repo: 'your-org/your-repo',
          // Optional target branch (default: 'main')
          branch: 'main',
          // Base path for markdown content in the repository
          docBasePath: 'src/content/docs',
        }),
      ],
    }),
  ],
});
```

### 2. Standard Astro Sites (Non-Starlight)

For standard Astro sites using custom layouts:

```javascript
import { defineConfig } from 'astro/config';
import { astroMdComments } from '@md-comments/starlight';

export default defineConfig({
  integrations: [
    astroMdComments({
      repo: 'your-org/your-repo',
    }),
  ],
});
```

---

## Authentication: GitHub OAuth Device Flow

Readers and maintainers can read comments anonymously. When adding a comment or reply:

1. The client opens an authorization modal with an 8-character code (e.g. `ABCD-1234`).
2. The user clicks **"Copy Code & Open GitHub"** to approve in GitHub's device authorization page (`https://github.com/login/device`).
3. The client receives the access token securely into browser `localStorage` and publishes the comment directly to `refs/md-comments/data`.

---

## Configuration Options

| Option              | Type       | Default                          | Description                                                    |
| ------------------- | ---------- | -------------------------------- | -------------------------------------------------------------- |
| `repo`              | `string`   | _(optional)_                     | Target repository in `"owner/repo"` format.                    |
| `branch`            | `string`   | `'main'`                         | Target branch for file path mapping.                           |
| `docBasePath`       | `string`   | `'src/content/docs'`             | Root directory of docs markdown in the git repository.         |
| `clientId`          | `string`   | _(built-in)_                     | Custom GitHub OAuth App Client ID if using a custom OAuth app. |
| `ui.drawerWidth`    | `number`   | `360`                            | Width of the slide-over comments panel in pixels.              |
| `ui.reactionEmojis` | `string[]` | `['👍', '👀', '❤️', '🎉', '❓']` | Available emoji reactions.                                     |

---

## Custom Page-Level Comments

You can also place a dedicated discussion component anywhere in your Astro templates:

```astro
---
import { PageComments } from '@md-comments/starlight/components/PageComments.astro';
---

<PageComments repo="your-org/your-repo" path="docs/intro.md" />
```
