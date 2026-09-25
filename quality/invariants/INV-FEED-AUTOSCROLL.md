---
id: 'INV-FEED-AUTOSCROLL'
description: 'Whenever a comment or reply is added across any interface, the active comment feed container must automatically and smoothly scroll to reveal the newly created entry at the bottom.'
enforcementMechanism: 'Optimistic container scrolling via scrollTo and scrollIntoView in chrome-extension, vscode-extension, obsidian-plugin, and embed-js validated by tests/feedAutoScroll.test.ts.'
---

# Invariant: Comment Feed Auto-Scroll on Addition

Whenever a user creates a new whole-document page comment, inline comment, or reply, the feed container must automatically, optimistically, and smoothly scroll to the bottom such that the newly created comment or reply is fully visible in the viewport without requiring manual user scrolling.
