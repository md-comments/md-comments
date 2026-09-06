---
id: 'FEAT-OBSIDIAN-VAULT'
title: 'Obsidian Local Vault Markdown Comment Storage'
category: 'obsidian'
interfaces:
  - 'obsidian'
flowId: 'FLOW-OBSIDIAN-VAULT'
dependsOn:
  - 'FEAT-STOR-LOCAL'
implementedIn:
  - 'shared/localFileBackend.ts'
verifiedIn:
  - 'tests/localFileBackend.test.ts'
invariants:
  - 'INV-FAST-FORWARD-RETRY'
minCoverage: 100
---

# Obsidian Local Vault Markdown Comment Storage

## Overview

Enables Obsidian PKM users to store and view Markdown comments locally inside their private vault using `.comments.yaml` companion files and the `LocalFileBackend` adapter.

## User Journey (Gherkin Scenarios)

- Given a Markdown note in an Obsidian vault
- When a user adds or modifies comments via the Obsidian plugin
- Then comments are stored in the local file system using `LocalFileBackend`
- When opening an existing note
- Then comments are parsed from local YAML and displayed in the notes sidebar
