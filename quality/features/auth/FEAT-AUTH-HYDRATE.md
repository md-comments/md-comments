---
id: 'FEAT-AUTH-HYDRATE'
title: 'User Profile & Permission Sync'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-AUTH-HYDRATE'
dependsOn:
  - 'FEAT-AUTH-DEVICE'
implementedIn:
  - 'chrome-extension/src/githubAuth.ts'
verifiedIn:
  - 'tests/chromeAuth.test.ts'
invariants: []
minCoverage: 100
---

# User Profile & Permission Sync

## Overview

Hydrates user login, display name, and avatar from GitHub API upon session establishment.

## User Journey (Gherkin Scenarios)

- Given a valid OAuth token
- When hydrateSession is invoked
- Then user profile details are populated in memory and client storage
