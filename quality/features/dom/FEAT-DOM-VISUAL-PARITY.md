---
id: 'FEAT-DOM-VISUAL-PARITY'
title: 'Cross-Interface Visual & UX Parity'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-DOM-VISUAL-PARITY'
dependsOn: []
implementedIn:
  - 'shared/styles/design-tokens.css'
  - 'shared/styles/components.css'
verifiedIn:
  - 'tests/design-tokens.test.ts'
  - 'tests/badge-styling-parity.test.ts'
  - 'tests/e2e/visual/cross-surface-component-diff.spec.ts'
invariants:
  - 'INV-VISUAL-PARITY'
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Cross-Interface Visual & UX Parity

## Overview

Ensures 100% visual and UX parity across the GitHub extension, VS Code extension, Obsidian plugin, and Demo/Starlight sites. Canonical tokens and components standardize FAB geometry and count badges, comments drawer, comment cards, reaction bars, composer toolbars, and status badges (`Orphaned` amber warning, `Resolved` green success, and tab counts).

## User Journey (Gherkin Scenarios)

- Given a Markdown document opened on GitHub, VS Code preview, Obsidian, or Demo site
- When comments with orphaned or resolved states are displayed
- Then the badges render with identical pill geometry (10px radius), 9px font size, amber (#d29922) / green (#3fb950) color schemes, and FAB/tab counter indicators across all interfaces
