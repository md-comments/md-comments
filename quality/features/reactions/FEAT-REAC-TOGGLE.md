---
id: 'FEAT-REAC-TOGGLE'
title: 'Emoji Reactions with Optimistic UI'
category: 'reactions'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-REAC-TOGGLE'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/reactions.spec.ts'
invariants: []
minCoverage: 100
---

# Emoji Reactions with Optimistic UI

## Overview

Enables users to add or remove emoji reactions (+1, heart, rocket, eyes) with instant UI reflection.

## User Journey (Gherkin Scenarios)

- Given a comment card
- When user clicks an emoji reaction button
- Then reaction count updates immediately and syncs in background
