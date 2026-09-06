---
id: 'FEAT-COMM-PREVIEW'
title: 'Sanitized Markdown Live Preview'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-COMM-PREVIEW'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/comments.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Sanitized Markdown Live Preview

## Overview

Allows toggling between Write and Preview tabs in the composer with live markdown rendering.

## User Journey (Gherkin Scenarios)

- Given text typed in the composer
- When user clicks Preview
- Then sanitized HTML is rendered in the preview container
