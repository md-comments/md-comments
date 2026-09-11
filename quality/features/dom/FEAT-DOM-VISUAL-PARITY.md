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
  - 'tests/e2e/visual/cross-surface-component-diff.spec.ts'
invariants:
  - 'INV-VISUAL-PARITY'
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Cross-Interface Visual & UX Parity

## Overview

Ensures 100% visual and UX parity across the GitHub extension, VS Code extension, and Demo/Starlight sites. Canonical tokens and components standardize FAB geometry, comments drawer, comment cards, reaction bars, and composer toolbars.

## User Journey (Gherkin Scenarios)

- Given a Markdown document opened on GitHub, VS Code preview, or Demo site
- When the comments drawer is toggled open
- Then the FAB, drawer width, comment cards, and reaction chips display matching visual geometry, typography, and contrast across all interfaces
