---
id: 'FEAT-COMM-PROGRESS-LINE'
title: 'Optimistic Comment Posting with Progress Line'
category: 'comments'
interfaces:
  - 'chrome-mv3'
  - 'safari-appex'
flowId: 'FLOW-COMM-PROGRESS-LINE'
dependsOn:
  - 'FEAT-COMM-PAGE'
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'chrome-extension/src/content.ts'
  - 'chrome-extension/src/sidebar.css'
verifiedIn:
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Optimistic Comment Posting with Progress Line

## Overview

Improves the posting user experience by optimistically displaying submitted comments and replies immediately. Rather than disabling the composer textbox or rendering button spinners, the input is immediately cleared for subsequent input while an animated progress line appears along the bottom of the submitting card until all background Git/REST requests finish.

## User Journey (Gherkin Scenarios)

- Given an open comment or reply composer in the sidebar
- When the user submits a page comment, inline comment, or reply
- Then the composer textarea clears immediately and remains responsive
- And the comment immediately renders in the comment list with an active 2px progressing bar underneath
- When all background commit and notification REST calls complete
- Then the progress line smoothly fades away and is removed from the card
