---
id: 'FEAT-EMBED-RUNTIME'
title: 'Standalone Redistributable Embed Runtime'
category: 'embed'
interfaces:
  - 'embed-js'
flowId: 'FLOW-EMBED-RUNTIME'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'website/demo-mock/embed/md-comments.js'
verifiedIn:
  - 'tests/e2e/embedded.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Standalone Redistributable Embed Runtime

## Overview

A zero-dependency, drop-in JavaScript bundle (`md-comments.js` + `md-comments.css`) that brings inline and whole-page collaborative commenting to any static or SSR HTML document via direct Git refs backend storage.

## User Journey (Gherkin Scenarios)

- Given a static HTML webpage with the embed script loaded
- When the page DOM finishes rendering
- Then a Floating Action Button (FAB) and comment drawer are automatically injected
- When the user toggles the FAB or presses Ctrl+Shift+C
- Then the comments drawer slides open and displays inline/page discussion threads
