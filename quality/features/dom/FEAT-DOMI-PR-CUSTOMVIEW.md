---
id: 'FEAT-DOMI-PR-CUSTOMVIEW'
title: 'Custom Markdown Source View Toggle on PRs'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-PR-CUSTOMVIEW'
dependsOn:
  - 'FEAT-DOMI-PRDIFF'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/pr-multidoc.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Custom Markdown Source View Toggle on PRs

## Overview

Adds custom tab switches on GitHub PR file containers to toggle between native diff and a formatted preview with comments.

## User Journey (Gherkin Scenarios)

- Given a Markdown file diff on a GitHub PR
- When the extension mounts on the file header
- Then a custom view toggle tab is injected
- When the user clicks the toggle
- Then the view switches between diff and custom commentable preview
