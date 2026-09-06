---
id: 'FEAT-AUTH-SIGNOUT'
title: 'Credential Purge & State Reset'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-AUTH-SIGNOUT'
dependsOn:
  - 'FEAT-AUTH-DEVICE'
implementedIn:
  - 'chrome-extension/src/githubAuth.ts'
verifiedIn:
  - 'tests/chromeAuth.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Credential Purge & State Reset

## Overview

Clears all session tokens, cached profile data, and re-renders interfaces in logged-out mode upon sign-out.

## User Journey (Gherkin Scenarios)

- Given an authenticated session
- When user clicks Sign Out
- Then tokens are purged from chrome.storage and state resets
