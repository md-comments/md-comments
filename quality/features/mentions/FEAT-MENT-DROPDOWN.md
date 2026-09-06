---
id: 'FEAT-MENT-DROPDOWN'
title: '@ Autocomplete Dropdown Menu'
category: 'mentions'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-MENT-DROPDOWN'
dependsOn: []
implementedIn:
  - 'shared/mentions.ts'
verifiedIn:
  - 'tests/e2e/mentions.spec.ts'
invariants: []
minCoverage: 100
---

# @ Autocomplete Dropdown Menu

## Overview

Detects @ character in comment textareas and opens filtered autocomplete suggestions for repository collaborators.

## User Journey (Gherkin Scenarios)

- Given an open composer textarea
- When user types @ followed by characters
- Then collaborator autocomplete dropdown appears
