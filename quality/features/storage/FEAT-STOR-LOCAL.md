---
id: 'FEAT-STOR-LOCAL'
title: '.comments.json Local File Fallback Mode'
category: 'storage'
interfaces:
  - 'vscode'
  - 'obsidian'
flowId: 'FLOW-STOR-LOCAL'
dependsOn: []
implementedIn:
  - 'shared/localFileBackend.ts'
verifiedIn:
  - 'tests/e2e/storage.spec.ts'
invariants: []
minCoverage: 100
---

# .comments.json Local File Fallback Mode

## Overview

Stores comments in a local .comments.json or sibling file when operating offline or in local PKM vaults.

## User Journey (Gherkin Scenarios)

- Given a local markdown file outside GitHub
- When comments are added
- Then comments are saved directly to local file storage
