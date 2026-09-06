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
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# refs/md-comments/data Git Storage Backend

## Overview

Stores comments in an orphan Git reference refs/md-comments/data encoded as YAML files.

## User Journey (Gherkin Scenarios)

- Given a comment update
- When written to Git storage
- Then Git tree, blob, and commit objects are created and ref updated
