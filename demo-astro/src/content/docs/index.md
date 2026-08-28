---
title: Markdown Comments Demo
description: Live interactive demonstration of Markdown Comments on Astro Starlight.
template: splash
hero:
  tagline: Experience real-time inline Markdown commenting right in your documentation. Highlight any text below to leave a comment!
  actions:
    - text: Try the Interactive Sandbox
      link: /demo-astro/guides/sandbox/
      icon: right-arrow
      variant: primary
    - text: Return to Main Website
      link: /
      icon: external
      variant: secondary
---

<div class="demo-banner">
  <h3>💡 Try It Now: Highlight Any Text on This Page</h3>
  <p>
    Select any sentence or paragraph on this page. A floating comment button will appear near your selection.
    Click it to start a discussion thread anchored to that exact text!
  </p>
</div>

## Key Features in This Demo

- **Zero Browser Extensions**: Readers and contributors can comment directly on documentation without installing anything.
- **Git Native & AI Friendly**: Comments are stored in custom Git refs (`refs/md-comments/data`) outside your source branches, keeping Markdown files clean for AI tools.
- **GitHub OAuth Device Flow**: Authenticate safely using standard GitHub OAuth Device Flow with zero custom backend servers required.
- **Multi-Platform Sync**: Discussions left here sync seamlessly with VS Code, Cursor, Antigravity, Obsidian, and GitHub Chrome extension.
