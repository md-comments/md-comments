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
  - 'FEAT-COMM-PROGRESS-LINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/comments.spec.ts'
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# In-Place Comment Editing & History

## Overview

Allows comment authors to edit comment bodies in place with immediate optimistic UI updates, animated progress line feedback, and updated timestamp preservation.

## User Journey (Gherkin Scenarios)

- Given a comment or reply submitted by the current user
- When user clicks Edit and submits updated text
- Then the editable form immediately disappears and the updated text renders in place
- And an active 2px progress line appears underneath the card or reply item while background persistence is in flight
- When the background commit finishes
- Then the progress line smoothly fades away and is removed from the card
