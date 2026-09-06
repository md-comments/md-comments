---
id: 'FEAT-DOMI-TURBO'
title: 'GitHub SPA Turbo Soft Navigation Re-binding'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-TURBO'
dependsOn:
  - 'FEAT-DOMI-BLOB'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/repoDetector.test.ts'
invariants: []
minCoverage: 100
---

# GitHub SPA Turbo Soft Navigation Re-binding

## Overview

Listens for turbo:render and soft navigation events on GitHub to tear down and re-bind comment overlays.

## User Journey (Gherkin Scenarios)

- Given an extension active on a GitHub repository
- When user performs a soft Turbo navigation to another markdown file
- Then the previous overlay is cleanly unmounted and initialized for the new file
