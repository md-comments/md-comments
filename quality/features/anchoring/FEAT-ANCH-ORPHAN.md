---
id: 'FEAT-ANCH-ORPHAN'
title: 'Orphan Comment Tray & Relocation UI'
category: 'anchoring'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-ANCH-ORPHAN'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'vscode-extension/src/orphan.ts'
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/anchor.test.ts'
invariants: []
minCoverage: 100
---

# Orphan Comment Tray & Relocation UI

## Overview

Collects comments whose target paragraph was deleted into an Orphan Tray with options to re-anchor or resolve.

## User Journey (Gherkin Scenarios)

- Given a comment whose target paragraph was removed from the document
- When the document is viewed
- Then the comment appears in the Orphan Tray with a relocation prompt
