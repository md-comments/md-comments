---
id: 'FEAT-DOMI-THEME'
title: 'Dynamic GitHub Dark/Light Theme Synchronization'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-THEME'
dependsOn:
  - 'FEAT-DOMI-DRAWER'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/theme.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Dynamic GitHub Dark/Light Theme Synchronization

## Overview

Monitors GitHub color mode changes (`data-color-mode` attribute on document root) and dynamically updates custom CSS styling tokens on comment sidebars, FABs, and menus.

## User Journey (Gherkin Scenarios)

- Given an active extension session on GitHub
- When the user toggles GitHub theme preferences between light and dark modes
- Then the comments drawer and toolbar styles dynamically adapt color palettes without page refresh
