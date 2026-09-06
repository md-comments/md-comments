---
id: 'FEAT-AUTH-RATELIMIT'
title: 'GitHub 403 Rate Limit Monitoring & Countdown'
category: 'auth'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-AUTH-RATELIMIT'
dependsOn: []
implementedIn:
  - 'shared/githubNotifications.ts'
verifiedIn:
  - 'tests/githubNotifications.test.ts'
invariants: []
minCoverage: 100
---

# GitHub 403 Rate Limit Monitoring & Countdown

## Overview

Detects GitHub rate limit 403 headers and gracefully warns the user with reset countdown timers.

## User Journey (Gherkin Scenarios)

- Given an active session exceeding rate limits
- When GitHub returns 403 with x-ratelimit-reset
- Then the UI displays a non-intrusive banner indicating cooldown remaining
