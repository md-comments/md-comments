---
id: 'FEAT-THRD-REPLY-EDIT'
title: 'In-Place Threaded Reply Editing'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-THRD-REPLY-EDIT'
dependsOn:
  - 'FEAT-THRD-REPLY'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/reply-lifecycle.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# In-Place Threaded Reply Editing

## Overview

Allows comment authors to edit previously submitted threaded reply messages in place and stamps the reply with an updated timestamp.

## User Journey (Gherkin Scenarios)

- Given an existing threaded reply authored by the current user
- When the user clicks the edit button on the reply card, modifies the text, and clicks save
- Then the reply content is updated in the orphan ref and reflects the revision immediately
