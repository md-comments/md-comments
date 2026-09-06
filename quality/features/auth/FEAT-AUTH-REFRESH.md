---
id: 'FEAT-AUTH-REFRESH'
title: 'Proactive Token Refresh & Expiration Lifecycle'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-AUTH-REFRESH'
dependsOn:
  - 'FEAT-AUTH-DEVICE'
implementedIn:
  - 'chrome-extension/src/githubAuth.ts'
verifiedIn:
  - 'tests/chromeAuth.test.ts'
  - 'tests/e2e/auth.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Proactive Token Refresh & Expiration Lifecycle

## Overview

Proactively monitors OAuth token expiration, refreshing expiring tokens silently in the background 5 minutes before expiration and purging stale credentials if the refresh token is revoked.

## User Journey (Gherkin Scenarios)

- Given an authenticated session with a token expiring within 5 minutes
- When an API request or background check runs
- Then a silent refresh request is dispatched to exchange the refresh token
- When the refresh token is rejected or revoked
- Then the session credentials are wiped and the user is prompted to sign in
