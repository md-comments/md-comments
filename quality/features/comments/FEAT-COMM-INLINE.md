---
id: 'FEAT-COMM-INLINE'
title: 'Inline Paragraph Comment Creation'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'vscode'
  - 'cursor'
  - 'antigravity'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-COMM-INLINE'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/comments.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Inline Paragraph Comment Creation

## Overview

Allows users to click inline comment buttons in the gutter and submit comments anchored to paragraphs.

## User Journey (Gherkin Scenarios)

- Given an authenticated user hovering over a paragraph
- When the user clicks the gutter comment icon and enters markdown text
- Then an inline comment thread is created and saved to refs/md-comments/data
