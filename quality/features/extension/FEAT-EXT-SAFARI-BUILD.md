---
id: 'FEAT-EXT-SAFARI-BUILD'
title: 'Safari WebExtension Multi-Target Build and Manifest V3 Packaging'
category: 'extension'
interfaces:
  - 'safari-mv3'
flowId: 'FLOW-EXT-SAFARI-BUILD'
dependsOn:
  - 'FEAT-EXT-PLAYWRIGHT-MOCK'
implementedIn:
  - 'chrome-extension/esbuild.js'
  - 'chrome-extension/src/browserApi.ts'
verifiedIn:
  - 'tests/browserApi.test.ts'
  - 'tests/e2e/safari-extension.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Safari WebExtension Multi-Target Build and Manifest V3 Packaging

## Overview

Compiles the unified WebExtension codebase into WebKit-compatible assets targeting Safari MV3, generating separate distribution artifacts under `chrome-extension/dist/safari` with promise-based storage and runtime adapters.

## User Journey (Gherkin Scenarios)

- Given the cross-browser extension source files
- When the build process is executed targeting Safari
- Then a Manifest V3 manifest with WebKit declarations is generated in `dist/safari/manifest.json`
- And the background script, content script, and styling assets are bundled and validated
