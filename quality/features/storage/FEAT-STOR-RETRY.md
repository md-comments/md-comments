---
id: 'FEAT-STOR-RETRY'
title: 'Fast-Forward Concurrency Conflict Auto-Retry'
category: 'storage'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-STOR-RETRY'
dependsOn:
  - 'FEAT-STOR-GITREF'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/storage.spec.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Fast-Forward Concurrency Conflict Auto-Retry

## Overview

Detects 422/409 Git ref update non-fast-forward rejections, pulling remote changes and retrying up to 3 times.

## User Journey (Gherkin Scenarios)

- Given concurrent writes to the same ref
- When a write receives non-fast-forward rejection
- Then remote data is fetched, merged, and committed with backoff
