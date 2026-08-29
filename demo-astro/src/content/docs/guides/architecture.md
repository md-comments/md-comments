---
title: Architecture & Git Refs Backend
description: Technical architecture of custom git ref storage for Markdown Comments.
---

> ### **AI-Orchestrated Docs. Human-Orchestrated Comments.**
>
> Docs live directly in your repository, and comments live as a native layer on top, never locked in third-party SaaS silos. AI agents orchestrate the documentation as code evolves, while humans orchestrate the reviews and discussions on rendered views.

Markdown Comments keeps your repository documentation clean and standard by storing all comment threads in a dedicated Git reference namespace: `refs/md-comments/data`.

## Why Custom Git Refs?

Traditional documentation commenting solutions have severe drawbacks:

1. **Inline HTML comment pollution**: Injecting `<!-- comment id="123" -->` directly into `.md` files clutters the document, breaks AI ingestion workflows, and triggers merge conflicts.
2. **Third-party database lock-in**: Storing comments in an external SaaS database loses the connection to Git history, branches, and code ownership.

### The Git Ref Solution

```text
git repository
├── refs/heads/main              <-- Clean documentation & code (AI-friendly)
├── refs/heads/feature-branch    <-- Your pull requests
└── refs/md-comments/data        <-- Comments stored as versioned YAML/JSON blobs
```

## How the Architecture Supports AI + Human Collaboration

1. **AI Agents Stay Unblocked**: Coding agents read clean markdown files directly from `refs/heads/`, avoiding confusing HTML tags or broken markdown ASTs.
2. **Humans Review Rendered Views Everywhere**: Whether in Astro/Starlight documentation sites, VS Code/Cursor/Antigravity previews, Obsidian notes, or GitHub PR diffs, humans comment on rendered prose.
3. **Continuous Iteration**: AI agents can query `refs/md-comments/data` to read open comment threads, revise documentation or code, and mark threads as resolved.

## How Astro Integration Fits In

The `@md-comments/starlight` integration operates client-side:

- **Build time**: Injects repository options, CSS stylesheets, and bootstrap runtime into the Starlight HTML shell.
- **Client runtime**: Fetches the comment dataset for the current page from GitHub REST API (`refs/md-comments/data`), anchors them onto the rendered DOM elements, and opens the side drawer when margin pins are clicked.
- **Cross-tool compatibility**: Comments submitted via this Astro site can immediately be viewed and answered in VS Code, Cursor, Antigravity, Obsidian, and Chrome Extension!
