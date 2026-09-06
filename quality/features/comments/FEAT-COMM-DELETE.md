---
id: 'FEAT-COMM-DELETE'
title: 'Comment Deletion & Ref Schema Update'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-COMM-DELETE'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/gitRefBackend.test.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Comment Deletion & Ref Schema Update

## Overview

Enables deleting comments or replies, synchronizing removals cleanly to the Git ref.

## User Journey (Gherkin Scenarios)

- Given an existing comment
- When user confirms deletion
- Then the comment is removed from the YAML storage schema
