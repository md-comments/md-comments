---
id: 'FEAT-THRD-FILTER'
title: 'Filter Open vs Resolved Threads'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-THRD-FILTER'
dependsOn:
  - 'FEAT-THRD-RESOLVE'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/placement.test.ts'
invariants: []
minCoverage: 100
---

# Filter Open vs Resolved Threads

## Overview

Provides toggle controls in the comment drawer to filter between All, Open, and Resolved threads.

## User Journey (Gherkin Scenarios)

- Given a document with both open and resolved threads
- When user selects Open filter
- Then resolved threads are hidden from the gutter and drawer
