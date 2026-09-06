---
id: 'FEAT-AUTH-AUTOFILL'
title: 'Device Authorization Flow Auto-Fill & Clipboard Integration'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-AUTH-AUTOFILL'
dependsOn:
  - 'FEAT-AUTH-DEVICE'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/device-autofill.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Device Authorization Flow Auto-Fill & Clipboard Integration

## Overview

Facilitates frictionless RFC 8628 OAuth login by automatically copying the 8-character user code and auto-filling the verification inputs when navigating to `github.com/login/device`.

## User Journey (Gherkin Scenarios)

- Given a user initiating the OAuth Device Authorization flow
- When the device code is received from GitHub
- Then a 1-click copy button copies the code to clipboard
- When the browser opens `github.com/login/device`
- Then the extension detects the inputs and auto-fills the user code
