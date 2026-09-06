---
id: 'FEAT-COMM-EDIT'
title: 'In-Place Comment Editing & History'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-COMM-EDIT'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/comments.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# In-Place Comment Editing & History

## Overview

Allows comment authors to edit comment bodies in place with updated timestamp preservation.

## User Journey (Gherkin Scenarios)

- Given a comment submitted by the current user
- When user clicks Edit and submits updated text
- Then the comment body is updated and rendered with an (edited) badge
