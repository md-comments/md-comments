---
id: 'FEAT-DOMI-DRAWER'
title: 'Responsive Collapsible Comment Drawer'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-DOMI-DRAWER'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/dom.spec.ts'
invariants: []
minCoverage: 100
---

# Responsive Collapsible Comment Drawer

## Overview

Sidebar drawer rendering all document threads with search, filters, and resolution controls.

## User Journey (Gherkin Scenarios)

- Given an open comment drawer
- When comments are actively loading over the network
- Then animated shimmer skeleton cards and a loading status banner are displayed
- When comments successfully load
- Then thread cards replace the skeleton cards without abrupt layout shifts
- When a network error occurs during comment fetch
- Then an error card with a retry button is displayed, allowing one-click reloading
- When user interacts with thread cards
- Then corresponding paragraph anchors are highlighted in the document
