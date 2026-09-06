---
id: 'FEAT-EXT-PLAYWRIGHT-LIVE'
title: 'Live Test Repository Playwright Automation on md-comments-test'
category: 'dom'
interfaces:
  - 'chrome-mv3'
flowId: 'FLOW-EXT-LIVE-E2E'
dependsOn:
  - 'FEAT-EXT-PLAYWRIGHT-MOCK'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/github-extension-live.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Live Test Repository Playwright Automation on md-comments-test

## Overview

Automates browser-driven comment lifecycle verification directly on live GitHub Markdown documents under `https://github.com/md-comments/md-comments-test` using real OAuth session tokens and automated test repository cleanup.

## User Journey (Gherkin Scenarios)

- Given `TEST_GITHUB_TOKEN` and `RUN_LIVE_GITHUB_E2E=true`
- When pre-flight cleanup wipes test refs on `md-comments/md-comments-test`
- And headless Chromium opens `https://github.com/md-comments/md-comments-test/blob/main/README.md`
- Then the user posts a live comment through the extension sidebar
- And the comment is committed to remote `refs/md-comments/data` and verified via GitHub REST API
- And post-flight cleanup restores the clean repository state
