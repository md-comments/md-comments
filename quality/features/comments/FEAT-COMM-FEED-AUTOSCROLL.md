---
id: 'FEAT-COMM-FEED-AUTOSCROLL'
title: 'Comment Feed Auto-Scroll on Addition'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'safari-extension'
  - 'vscode'
  - 'embed'
  - 'obsidian'
flowId: 'FLOW-COMM-FEED-AUTOSCROLL'
dependsOn:
  - 'FEAT-COMM-PAGE'
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'chrome-extension/src/content.ts'
  - 'vscode-extension/media/preview-webview.js'
  - 'website/demo-mock/embed/md-comments.js'
  - 'obsidian-plugin/src/sidebarView.ts'
verifiedIn:
  - 'tests/feedAutoScroll.test.ts'
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-FEED-AUTOSCROLL'
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Comment Feed Auto-Scroll on Addition

## Overview

Whenever a comment or reply is submitted across any interface, the active comment feed container automatically and smoothly scrolls to the bottom so that the newly created comment or reply is fully visible in the viewport without requiring manual scrolling.

## User Journey (Gherkin Scenarios)

- Given a comment feed with existing comments exceeding container height
- When the user submits a whole-document page comment, inline comment, or reply
- Then the feed container automatically and smoothly scrolls to the bottom
- And the newly added comment or reply is visible within the viewport
