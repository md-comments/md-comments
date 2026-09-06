---
id: 'FEAT-DOMI-FAB'
title: 'Persistent Floating Action Button (FAB)'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-DOMI-FAB'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/placement.test.ts'
invariants: []
minCoverage: 100
---

# Persistent Floating Action Button (FAB)

## Overview

Displays floating action button showing comment counts and toggling the comment drawer.

## User Journey (Gherkin Scenarios)

- Given a supported markdown page
- When user clicks the FAB in the corner
- Then the comments drawer slides open
