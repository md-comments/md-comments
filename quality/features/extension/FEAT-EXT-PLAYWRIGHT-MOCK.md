---
id: 'FEAT-EXT-PLAYWRIGHT-MOCK'
title: 'Hermetic Playwright E2E Automation for Chrome Extension'
category: 'dom'
interfaces:
  - 'chrome-mv3'
flowId: 'FLOW-EXT-MOCK-E2E'
dependsOn:
  - 'FEAT-DOMI-BLOB'
  - 'FEAT-DOMI-FAB'
  - 'FEAT-DOMI-DRAWER'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/github-extension-hermetic.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Hermetic Playwright E2E Automation for Chrome Extension

## Overview

Automates the installation, launch, DOM injection, and comment submission lifecycle for the unpacked MV3 Chrome Extension inside headless Chromium against an isolated local mock GitHub API.

## User Journey (Gherkin Scenarios)

- Given an unpacked Chrome extension loaded in Chromium with mock OAuth storage
- When navigating to a simulated GitHub markdown blob view on `github.com`
- Then the `#md-comments-fab-toggle` button is injected into the DOM
- When the user clicks the FAB button and submits a page comment
- Then the comment card renders in the sidebar drawer and the Git ref `refs/md-comments/data` is committed to the mock API
