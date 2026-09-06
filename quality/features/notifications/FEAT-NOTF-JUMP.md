---
id: 'FEAT-NOTF-JUMP'
title: 'Notification Deep-Linking & Anchor Jumping'
category: 'notifications'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-NOTF-JUMP'
dependsOn:
  - 'FEAT-NOTF-POLL'
  - 'FEAT-ANCH-HASH'
implementedIn:
  - 'shared/githubNotifications.ts'
verifiedIn:
  - 'tests/githubNotifications.test.ts'
invariants: []
minCoverage: 100
---

# Notification Deep-Linking & Anchor Jumping

## Overview

Clicking a notification item navigates directly to the referenced document and scrolls to the highlighted anchor.

## User Journey (Gherkin Scenarios)

- Given an unread notification in the tray
- When user clicks the notification
- Then the browser navigates to the anchor and highlights the thread
