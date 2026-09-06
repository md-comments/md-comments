---
id: 'FEAT-THRD-SEARCH'
title: 'Real-Time Sidebar Comment & Author Search'
category: 'threads'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-THRD-SEARCH'
dependsOn:
  - 'FEAT-THRD-FILTER'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/search.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Real-Time Sidebar Comment & Author Search

## Overview

Enables live searching and filtering inside the comments drawer by comment body content or author username.

## User Journey (Gherkin Scenarios)

- Given an open comments sidebar drawer containing multiple comment threads
- When a user enters a query into the drawer search input field
- Then only comment cards matching the query text or author are displayed
- When the search query is cleared
- Then all comments for the current tab restore immediately
