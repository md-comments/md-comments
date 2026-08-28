---
title: How Markdown Comments Works
description: Learn how the inline comments overlay integrates with Astro Starlight.
---

Markdown Comments enables collaborative review workflows for technical documentation, specifications, and proposals directly in the browser and in code editors.

## 1. Highlighting Text

When you read a documentation page, select any string of text. The Markdown Comments plugin tracks the DOM text node and its character offset relative to the Markdown source AST.

> **Try highlighting this sentence right now!**
> A tooltip button with a comment icon will appear. Clicking it opens the comment creation dialog.

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
