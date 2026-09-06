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
- When user interacts with thread cards
- Then corresponding paragraph anchors are highlighted in the document
