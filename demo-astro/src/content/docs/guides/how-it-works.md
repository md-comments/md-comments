---
title: How Markdown Comments Works
description: Learn how the inline comments overlay integrates with Astro Starlight.
---

> ### **AI-Orchestrated Docs. Human-Orchestrated Comments.**
>
> Docs live directly in your repository, and comments live as a native layer on top, never locked in third-party SaaS silos. AI agents orchestrate the documentation as code evolves, while humans orchestrate the reviews and discussions on rendered views.

Markdown Comments enables frictionless, real-time collaboration for technical documentation, specifications, and proposals directly on rendered views across browsers and code editors.

## 1. Highlighting Rendered Prose

When you read a documentation page or preview, select any string of text. The Markdown Comments engine tracks the rendered DOM text and computes a robust anchor cascade (paragraph hash, fuzzy text match, heading offset).

> **Try highlighting this sentence right now!**
> A floating tooltip button with a comment icon will appear. Clicking it opens the comment creation dialog.

## 2. Leaving a Comment

When you leave a comment:

- An anchor identifier is created pointing to the file path, line range, and exact text excerpt.
- A margin indicator pin is placed alongside the paragraph or heading.
- You can add replies, emojis, and mark threads as resolved.

## 3. GitHub OAuth Authentication

When submitting your first comment or syncing data:

- Click **Sign In with GitHub** in the top right drawer or auth modal.
- A standard GitHub Device Flow code is provided.
- Once authenticated, your comments are written directly to your GitHub repository.

```json
{
  "anchor": {
    "file": "demo-astro/src/content/docs/guides/how-it-works.md",
    "selectedText": "Try highlighting this sentence right now!"
  },
  "threads": [
    {
      "id": "c1",
      "author": "octocat",
      "body": "This is an example comment thread."
    }
  ]
}
```
