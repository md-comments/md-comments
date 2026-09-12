---
id: 'FEAT-ANCH-COMPLEX'
title: 'Complex Element Anchoring (Tables, Fences, Quotes)'
category: 'anchoring'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-ANCH-COMPLEX'
dependsOn:
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'shared/anchor.ts'
  - 'vscode-extension/src/markdownItPlugin.ts'
verifiedIn:
  - 'tests/e2e/anchoring.spec.ts'
  - 'tests/vscode-table-anchoring.test.ts'
invariants: []
minCoverage: 100
---

# Complex Element Anchoring (Tables, Fences, Quotes)

## Overview

Specialized anchoring logic for multi-line markdown constructs such as tables, code fences, and nested quotes.

## User Journey (Gherkin Scenarios)

- Given a markdown code fence or markdown table
- When user anchors a comment
- Then the block boundaries are normalized and accurately hashed
