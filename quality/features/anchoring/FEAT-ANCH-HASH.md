---
id: 'FEAT-ANCH-HASH'
title: 'Deterministic Content Paragraph Hashing'
category: 'anchoring'
interfaces:
  - 'chrome-mv3'
  - 'firefox-mv3'
  - 'vscode'
  - 'starlight'
  - 'embed-js'
flowId: 'FLOW-ANCH-HASH'
dependsOn: []
implementedIn:
  - 'shared/anchor.ts'
verifiedIn:
  - 'tests/e2e/anchoring.spec.ts'
invariants: []
minCoverage: 100
---

# Deterministic Content Paragraph Hashing

## Overview

Computes normalized SHA-256 substring hashes of paragraph blocks for stable content anchoring.

## User Journey (Gherkin Scenarios)

- Given a markdown paragraph with varying whitespace
- When computeParagraphHash is executed
- Then normalized deterministic hash prefix is returned
