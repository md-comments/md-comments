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
  - 'tests/e2e/dom.spec.ts'
invariants: []
minCoverage: 100
---

# Persistent Floating Action Button (FAB)

## Overview

Displays floating action button showing comment counts and toggling the comment drawer.

## User Journey (Gherkin Scenarios)

- Given a supported markdown page
- When comments are being fetched over the network
- Then the FAB is immediately visible with an active spinner ring and aria-busy="true"
- When comments successfully load
- Then the spinner ring fades and the FAB badge displays the active comment count
- When user clicks the FAB in the corner
- Then the comments drawer slides open
