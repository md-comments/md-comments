---
id: 'FEAT-STARLIGHT-DOCS'
title: 'Astro Starlight Documentation Plugin Integration'
category: 'starlight'
interfaces:
  - 'starlight'
flowId: 'FLOW-STARLIGHT-DOCS'
dependsOn:
  - 'FEAT-COMM-INLINE'
implementedIn:
  - 'starlight-plugin/src/starlight.ts'
verifiedIn:
  - 'tests/starlight-plugin.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Astro Starlight Documentation Plugin Integration

## Overview

Provides an Astro integration and Starlight user plugin to inject decentralized Markdown commenting widgets into static and SSR documentation websites.

## User Journey (Gherkin Scenarios)

- Given an Astro Starlight documentation site with `@md-comments/starlight` installed
- When a documentation page renders
- Then paragraph anchors and floating comment triggers are injected
- When a reader clicks to view or leave a comment
- Then comments are fetched from GitHub and rendered in a floating sidebar
