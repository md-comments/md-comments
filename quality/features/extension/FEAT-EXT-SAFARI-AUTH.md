---
id: 'FEAT-EXT-SAFARI-AUTH'
title: 'Safari OAuth Device Flow Token Lifecycle and Storage Resilience'
category: 'extension'
interfaces:
  - 'safari-auth'
flowId: 'FLOW-EXT-SAFARI-AUTH'
dependsOn:
  - 'FEAT-EXT-SAFARI-BUILD'
implementedIn:
  - 'chrome-extension/src/githubAuth.ts'
  - 'chrome-extension/src/browserApi.ts'
verifiedIn:
  - 'tests/safariAuth.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Safari OAuth Device Flow Token Lifecycle and Storage Resilience

## Overview

Manages the OAuth Device Authorization Flow (RFC 8628) token exchange, silent proactive token refresh, and persistent storage specifically tuned for Safari WebExtension promise-based local storage APIs without using Personal Access Tokens.

## User Journey (Gherkin Scenarios)

- Given a user on a GitHub documentation page in Safari
- When requesting authorization without stored credentials
- Then the OAuth Device Flow code prompt is displayed
- And once approved, the GitHub OAuth tokens are saved into Safari promise-based storage
- And tokens expiring within 5 minutes are silently rotated without disrupting user interaction
