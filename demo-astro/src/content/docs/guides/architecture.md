---
title: Architecture & Git Refs Backend
description: Technical architecture of custom git ref storage for Markdown Comments.
---

Markdown Comments keeps your Markdown files clean and standard by storing all comment threads in a dedicated Git reference namespace: `refs/md-comments/data`.

## Why Custom Git Refs?

Traditional documentation commenting solutions have severe drawbacks:

1. **Inline HTML comment pollution**: Injecting `<!-- comment id="123" -->` directly into `.md` files clutters the document, breaks AI ingestion workflows, and triggers merge conflicts.
2. **Third-party database lock-in**: Storing comments in an external SaaS database loses the connection to Git history, branches, and code ownership.

### The Git Ref Solution

```text
git repository
├── refs/heads/main              <-- Clean documentation & code
├── refs/heads/feature-branch    <-- Your pull requests
└── refs/md-comments/data        <-- Comments stored as versioned JSON blobs
```

## How Astro Integration Fits In

The `@md-comments/starlight` integration operates client-side:

- **Build time**: Injects repository options, CSS stylesheets, and bootstrap runtime into the Starlight HTML shell.
- **Client runtime**: Fetches the comment dataset for the current page from GitHub REST API (`refs/md-comments/data`), anchors them onto the rendered DOM elements, and opens the side drawer when margin pins are clicked.
- **Cross-tool compatibility**: Comments submitted via this Astro site can immediately be viewed and answered in VS Code, Cursor, Antigravity, Obsidian, and Chrome Extension!
