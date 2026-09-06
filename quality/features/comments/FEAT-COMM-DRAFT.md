---
id: 'FEAT-COMM-DRAFT'
title: 'Comment Draft Auto-Saving & Restoration'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-COMM-DRAFT'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/drafts.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Comment Draft Auto-Saving & Restoration

## Overview

Persists user input in comment and reply composers to local storage (`chrome.storage.local`) in real time to prevent accidental data loss across tab reloads or navigations, restoring unsubmitted drafts upon reopening the composer.

## User Journey (Gherkin Scenarios)

- Given an authenticated user typing in the comment composer
- When the user navigates away or refreshes the page without submitting
- Then the drafted comment text is automatically preserved and reloaded into the composer
- When the user finally submits the comment
- Then the temporary draft is purged from storage
