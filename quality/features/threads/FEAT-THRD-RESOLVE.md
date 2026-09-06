---
id: 'FEAT-THRD-RESOLVE'
title: 'Resolve & Reopen Thread Lifecycle'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-THRD-RESOLVE'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/threads.spec.ts'
invariants: []
minCoverage: 100
---

# Resolve & Reopen Thread Lifecycle

## Overview

Allows marking comment threads as resolved, collapsing them visually and updating thread state.

## User Journey (Gherkin Scenarios)

- Given an open comment thread
- When user clicks Resolve Thread
- Then resolved status is set to true and thread collapses
