---
id: 'FEAT-THRD-REPLY-DELETE'
title: 'Threaded Reply Deletion & Hierarchy Preservation'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-THRD-REPLY-DELETE'
dependsOn:
  - 'FEAT-THRD-REPLY'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/reply-lifecycle.spec.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Threaded Reply Deletion & Hierarchy Preservation

## Overview

Enables users to delete their own threaded reply from a comment thread while preserving the parent comment and remaining sibling replies.

## User Journey (Gherkin Scenarios)

- Given a comment thread containing two or more replies
- When an authorized user clicks delete on a reply and confirms
- Then the selected reply is removed from the replies list in storage
- And the parent thread remains open and valid
