---
id: 'FEAT-SECU-XSS'
title: 'DOMPurify Markdown Content Sanitization'
category: 'security'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-SECU-XSS'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/placement.test.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# DOMPurify Markdown Content Sanitization

## Overview

Runs all rendered markdown HTML through strict DOMPurify rules blocking malicious scripts, iframes, and protocols.

## User Journey (Gherkin Scenarios)

- Given a comment containing XSS payloads (e.g. `<img src="x" onerror="alert(1)">`)
- When the comment card renders
- Then unsafe tags and handlers are stripped completely
