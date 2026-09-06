---
id: 'FEAT-MENT-KEYBOARD'
title: 'Keyboard Navigation & Tab Insertion for Mentions'
category: 'mentions'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-MENT-KEYBOARD'
dependsOn:
  - 'FEAT-MENT-DROPDOWN'
implementedIn:
  - 'shared/mentions.ts'
verifiedIn:
  - 'tests/mentions.test.ts'
invariants: []
minCoverage: 100
---

# Keyboard Navigation & Tab Insertion for Mentions

## Overview

Supports arrow key navigation and Enter/Tab selection for mention suggestions.

## User Journey (Gherkin Scenarios)

- Given an open mention dropdown
- When user presses ArrowDown and Enter
- Then selected username is inserted into the textarea
