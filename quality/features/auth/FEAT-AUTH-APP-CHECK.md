---
id: 'FEAT-AUTH-APP-CHECK'
title: 'GitHub App Installation Verification & Waiting UX'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'safari-appex'
flowId: 'FLOW-AUTH-APP-CHECK'
dependsOn:
  - 'FEAT-AUTH-DEVICE'
implementedIn:
  - 'chrome-extension/src/content.ts'
  - 'chrome-extension/src/githubApi.ts'
verifiedIn:
  - 'tests/chromeAuth.test.ts'
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# GitHub App Installation Verification & Waiting UX

## Overview

Provides visual feedback and status monitoring while validating GitHub user authentication and GitHub App installation permissions. Includes animated spinners during device flow polling, immediate post-authorization validation cards, cache-busting re-verification, and automatic re-check on browser tab focus.

## User Journey (Gherkin Scenarios)

- Given an unauthenticated or newly authorized user in the GitHub sidebar panel
- When device code authorization is pending
- Then an animated waiting indicator displays guidance that the panel will update automatically
- When authorization completes
- Then a validation card displays verifying GitHub App installation and repository permissions
- When the user returns from installing or configuring the GitHub App
- Then the panel automatically re-verifies installation status without returning stale cached data
