---
id: 'FEAT-DOMI-BLOB'
title: 'GitHub Markdown Blob DOM Injection'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-BLOB'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/dom.spec.ts'
invariants: []
minCoverage: 100
---

# GitHub Markdown Blob DOM Injection

## Overview

Injects inline comment trigger buttons into the GitHub markdown blob viewer DOM.

## User Journey (Gherkin Scenarios)

- Given a GitHub markdown file page (github.com/owner/repo/blob/...)
- When content script initializes
- Then gutter comment buttons are injected adjacent to markdown blocks
