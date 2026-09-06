---
id: 'FEAT-COMM-PAGE'
title: 'Whole-Document Page Comments'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-COMM-PAGE'
dependsOn: []
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/gitRefBackend.test.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Whole-Document Page Comments

## Overview

Supports top-level discussion attached to the document as a whole rather than a specific paragraph anchor.

## User Journey (Gherkin Scenarios)

- Given a markdown document view
- When the user opens the page comment tab and submits a note
- Then the comment appears in the page_comments list of the storage schema
