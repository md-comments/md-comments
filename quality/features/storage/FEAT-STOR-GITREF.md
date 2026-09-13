---
id: 'FEAT-STOR-GITREF'
title: 'refs/md-comments/data Git Storage Backend'
category: 'storage'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-STOR-GITREF'
dependsOn: []
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/storage.spec.ts'
  - 'tests/gitRefBackend.test.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
  - 'INV-BASE-TREE-SHA'
minCoverage: 100
---

# refs/md-comments/data Git Storage Backend

## Overview

Stores comments in an orphan Git reference `refs/md-comments/data` encoded as YAML files, resolving base commit tree SHAs to prevent writing corrupt orphan commit trees.

## User Journey (Gherkin Scenarios)

- Given a comment update
- When written to Git storage
- Then base commit tree SHA is resolved from GitHub Git Data API
- And Git tree, blob, and commit objects are created and ref updated with retry on race conditions
