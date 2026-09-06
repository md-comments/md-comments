---
id: 'FEAT-NOTF-POLL'
title: 'Notification Polling & Tray Sync'
category: 'notifications'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-NOTF-POLL'
dependsOn: []
implementedIn:
  - 'shared/githubNotifications.ts'
verifiedIn:
  - 'tests/githubNotifications.test.ts'
invariants: []
minCoverage: 100
---

# Notification Polling & Tray Sync

## Overview

Periodically checks for new mentions or replies and displays unread count badges.

## User Journey (Gherkin Scenarios)

- Given an authenticated user
- When a new mention is committed to the ref
- Then the notification badge count increments
