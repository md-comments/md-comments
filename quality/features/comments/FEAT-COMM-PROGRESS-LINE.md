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
  - 'FEAT-COMM-EDIT'
implementedIn:
  - 'chrome-extension/src/content.ts'
  - 'chrome-extension/src/sidebar.css'
verifiedIn:
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Optimistic Comment Posting and Editing with Progress Line

## Overview

Improves the posting and editing user experience by optimistically displaying submitted and edited comments/replies immediately. Rather than disabling textboxes or rendering button spinners, input forms dismiss immediately while an animated progress line appears along the bottom of the submitting/edited card until all background Git/REST requests finish.

## User Journey (Gherkin Scenarios)

- Given an open comment or reply composer in the sidebar
- When the user submits a page comment, inline comment, or reply
- Then the composer textarea clears immediately and remains responsive
- And the comment immediately renders in the comment list with an active 2px progressing bar underneath
- When all background commit and notification REST calls complete
- Then the progress line smoothly fades away and is removed from the card
- Given an existing comment or reply card in the sidebar
- When the user edits the comment or reply and clicks Save
- Then the editable section immediately disappears and the updated text renders in place
- And an active 2px progress line appears along the bottom of the card or reply item
- When all background Git writes complete
- Then the progress line smoothly fades away and is removed
