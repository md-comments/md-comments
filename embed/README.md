# @md-comments/embed

> Standalone, zero-dependency embed runtime for Markdown Comments on any HTML document or static site.

Enables collaborative, inline commenting on documentation, blogs, static sites, and HTML pages with zero server configuration required. Comments are stored in Git on a dedicated orphan branch (`refs/md-comments/data`).

## 🚀 Quick Start (HTML / CDN)

Add the CSS and script tag to any web page:

```html
<!-- Stylesheet -->
<link rel="stylesheet" href="https://unpkg.com/@md-comments/embed/dist/md-comments.min.css" />

<!-- Runtime script -->
<script
  src="https://unpkg.com/@md-comments/embed/dist/md-comments.min.js"
  data-repo="owner/repo"
  data-file="docs/index.md"
  data-branch="main"
  data-theme="auto"
  async
></script>
```

### Script Attributes

| Attribute       | Description                               | Default                         |
| :-------------- | :---------------------------------------- | :------------------------------ |
| `data-repo`     | Target GitHub repository (`owner/repo`)   | _Required_                      |
| `data-file`     | Path to markdown source file in repo      | `window.location.pathname`      |
| `data-branch`   | Target branch for comments ref            | `main`                          |
| `data-theme`    | Color theme (`light`, `dark`, `auto`)     | `auto`                          |
| `data-selector` | CSS selector for annotatable content area | `main, article, .content, body` |

---

## 📦 NPM Installation

```bash
npm install @md-comments/embed
# or
pnpm add @md-comments/embed
```

### Programmatic Usage

```ts
import '@md-comments/embed/styles.css';
import { initMdComments } from '@md-comments/embed';

initMdComments({
  repo: 'owner/repo',
  file: 'docs/architecture.md',
  branch: 'main',
  theme: 'auto',
});
```

---

## 📄 License

MIT © [Markdown Comments](https://github.com/md-comments/md-comments)
