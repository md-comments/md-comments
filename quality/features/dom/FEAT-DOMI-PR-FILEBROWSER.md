---
id: 'FEAT-DOMI-PR-FILEBROWSER'
title: 'Multi-File PR Diff Browser Navigation Drawer'
category: 'dom'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-DOMI-PR-FILEBROWSER'
dependsOn:
  - 'FEAT-DOMI-PRDIFF'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/pr-multidoc.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Multi-File PR Diff Browser Navigation Drawer

## Overview

Provides a collapsible file browser panel within the PR comments drawer listing all Markdown files included in the pull request diff, allowing quick switching between file contexts.

## User Journey (Gherkin Scenarios)

- Given a GitHub pull request with multiple Markdown files modified
- When the comments drawer is opened
- Then a file list presents each Markdown file with its directory path
- When a user clicks a file item
- Then the document viewport smoothly scrolls to that file container and sets its active context
