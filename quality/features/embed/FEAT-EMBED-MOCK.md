---
id: 'FEAT-EMBED-MOCK'
title: 'Zero-Auth Offline Mock Mode for Embedded Runtime'
category: 'embed'
interfaces:
  - 'embed-js'
flowId: 'FLOW-EMBED-MOCK'
dependsOn:
  - 'FEAT-EMBED-RUNTIME'
implementedIn:
  - 'website/demo-mock/embed/md-comments.js'
verifiedIn:
  - 'tests/e2e/embedded.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Zero-Auth Offline Mock Mode for Embedded Runtime

## Overview

Enables fully offline, zero-credential interactive testing and demonstration of the embedded runtime using simulated review personas, local browser storage, and in-memory mock comment operations.

## User Journey (Gherkin Scenarios)

- Given a page with `data-mock="true"` or `?mock=true` set on the embed runtime
- When a user submits comments, threaded replies, or emoji reactions
- Then changes are optimistically saved to local session state without making outbound GitHub API calls
- When the page is reloaded
- Then mock comments persist and are cleanly displayed in the drawer
