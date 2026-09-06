---
id: 'FEAT-THRD-REPLY'
title: 'Threaded Replies Hierarchy'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'vscode'
  - 'starlight'
flowId: 'FLOW-THRD-REPLY'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'shared/gitRefBackend.ts'
verifiedIn:
  - 'tests/e2e/threads.spec.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Threaded Replies Hierarchy

## Overview

Supports hierarchical replies nested under inline and page comments.

## User Journey (Gherkin Scenarios)

- Given an existing comment card
- When user enters text into Reply and clicks Submit
- Then reply is added to the replies array of the comment
