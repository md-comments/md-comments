---
id: 'FEAT-REAC-TOOLTIP'
title: 'Reaction Usernames Tooltip & Deduplication'
category: 'reactions'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-REAC-TOOLTIP'
dependsOn:
  - 'FEAT-REAC-TOGGLE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/reactions.spec.ts'
invariants: []
minCoverage: 100
---

# Reaction Usernames Tooltip & Deduplication

## Overview

Displays tooltip listing users who reacted to a comment while preventing duplicate votes from one user.

## User Journey (Gherkin Scenarios)

- Given a comment with reactions
- When user hovers over reaction badge
- Then tooltip displays participant usernames
