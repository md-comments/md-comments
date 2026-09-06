---
id: 'FEAT-SECU-CSP'
title: 'Content Security Policy Adherence'
category: 'security'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'starlight'
flowId: 'FLOW-SECU-CSP'
dependsOn: []
implementedIn:
  - 'chrome-extension/manifest.json'
verifiedIn:
  - 'tests/phase0-orchestration.test.ts'
invariants: []
minCoverage: 100
---

# Content Security Policy Adherence

## Overview

Strict MV3 CSP compliance: zero eval(), zero inline scripts, and scoped connect-src permissions.

## User Journey (Gherkin Scenarios)

- Given Chrome MV3 extension runtime
- When extension executes
- Then no unsafe-eval or remote script executions occur
