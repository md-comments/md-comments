---
id: 'FEAT-ANCH-RELOCATE'
title: 'Fuzzy Anchor Relocation Across Document Edits'
category: 'anchoring'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-ANCH-RELOCATE'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'shared/anchor.ts'
verifiedIn:
  - 'tests/anchor.test.ts'
invariants: []
minCoverage: 100
---

# Fuzzy Anchor Relocation Across Document Edits

## Overview

Uses fuzzy Levenshtein and n-gram matching to relocate anchors when paragraphs receive minor edits.

## User Journey (Gherkin Scenarios)

- Given an anchor on an earlier version of a paragraph
- When the paragraph is slightly edited in a new commit
- Then the fuzzy relocator re-binds the comment thread to the updated paragraph
