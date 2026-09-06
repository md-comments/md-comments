---
id: 'FEAT-ANCH-HIGHLIGHT'
title: 'Persistent Selection Highlighting & Hover Tooltips'
category: 'anchoring'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-ANCH-HIGHLIGHT'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/highlights.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Persistent Selection Highlighting & Hover Tooltips

## Overview

Renders visual mark elements over anchored paragraph texts corresponding to active comments and displays informative hover tooltips previewing comment author and content snippet.

## User Journey (Gherkin Scenarios)

- Given an open Markdown document with active inline comments
- When the page is rendered by the extension
- Then `<mark class="md-comment-highlight">` elements are applied over the anchored paragraphs
- When a user hovers over a highlighted text snippet
- Then an interactive tooltip appears displaying the author and truncated comment preview
