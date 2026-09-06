---
id: 'FEAT-STOR-INIT-PROMPT'
title: 'Repo Onboarding Prompt & Data Ref Setup Flow'
category: 'storage'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
flowId: 'FLOW-STOR-INIT-PROMPT'
dependsOn:
  - 'FEAT-STOR-GITREF'
implementedIn:
  - 'chrome-extension/src/content.ts'
verifiedIn:
  - 'tests/e2e/onboarding.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Repo Onboarding Prompt & Data Ref Setup Flow

## Overview

Detects when a repository has not yet initialized the `refs/md-comments/data` storage reference and presents an intuitive setup banner with guidance to initialize comments.

## User Journey (Gherkin Scenarios)

- Given a user visiting a Markdown document on an uninitialized repository
- When the extension queries for existing comments data ref
- Then an onboarding card appears informing the user that comments can be enabled
- When the user submits the first comment
- Then the orphan data ref is created and initialized automatically
