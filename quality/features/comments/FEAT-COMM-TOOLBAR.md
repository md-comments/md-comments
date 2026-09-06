---
id: 'FEAT-COMM-TOOLBAR'
title: 'Markdown Composer Formatting Toolbar'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-COMM-TOOLBAR'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/placement.test.ts'
invariants: []
minCoverage: 100
---

# Markdown Composer Formatting Toolbar

## Overview

Provides formatting action buttons (bold, italic, code, quote, link) in comment composers.

## User Journey (Gherkin Scenarios)

- Given selected text in the comment textarea
- When user clicks Bold button
- Then text is wrapped with markdown asterisks
