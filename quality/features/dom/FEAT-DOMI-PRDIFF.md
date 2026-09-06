---
id: 'FEAT-DOMI-PRDIFF'
title: 'GitHub PR Diff View Injection'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-PRDIFF'
dependsOn: []
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/repoDetector.test.ts'
invariants: []
minCoverage: 100
---

# GitHub PR Diff View Injection

## Overview

Detects markdown diff blocks inside GitHub Pull Request views and mounts comments alongside PR diffs.

## User Journey (Gherkin Scenarios)

- Given a Pull Request with modified markdown files
- When user navigates to Files Changed tab
- Then Markdown Comments anchors mount into the markdown preview panels
