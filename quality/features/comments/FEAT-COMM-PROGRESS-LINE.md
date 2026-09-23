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
  - 'tests/chromeInlineSubmission.test.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Optimistic Comment Posting and Editing with Progress Line

## Overview

Improves the posting and editing user experience by optimistically displaying submitted and edited comments/replies immediately. Rather than keeping the authoring UI open with button spinners, input forms and inline composers dismiss immediately upon submission while an animated progress line appears along the bottom of the submitting/edited card in the feed until all background Git/REST requests finish.

## User Journey (Gherkin Scenarios)

- Given an open inline comment composer in the sidebar
- When the user submits the inline comment
- Then the inline authoring UI disappears immediately without displaying button loading spinners
- And the comment immediately appears in the feed with an active 2px progressing underline underneath
- When all background commit and notification REST calls complete
- Then the progress line smoothly fades away and is removed from the card
- Given an existing comment or reply card in the sidebar
- When the user edits the comment or reply and clicks Save
- Then the editable section immediately disappears and the updated text renders in place
- And an active 2px progress line appears along the bottom of the card or reply item
- When all background Git writes complete
- Then the progress line smoothly fades away and is removed
