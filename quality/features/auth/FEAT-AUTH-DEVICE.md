---
id: 'FEAT-AUTH-DEVICE'
title: 'OAuth Device Authorization Flow (RFC 8628)'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-AUTH-DEVICE'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/githubAuth.ts'
verifiedIn:
  - 'tests/e2e/auth.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# OAuth Device Authorization Flow (RFC 8628)

## Overview

Allows users to authenticate frictionless via OAuth Device Flow by visiting github.com/login/device with a short verification code.

## User Journey (Gherkin Scenarios)

- Given an unauthenticated user clicking login in the extension or embed widget
- When the authorization modal opens
- Then a user code is generated and automatically copied to clipboard
- When the user verifies on GitHub and authorizes the application
- Then tokens are securely exchanged and stored in client storage
