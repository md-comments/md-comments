---
id: 'FEAT-AUTH-IDE'
title: 'IDE Native Authentication Session Provider'
category: 'auth'
interfaces:
  - 'vscode'
  - 'cursor'
  - 'antigravity'
flowId: 'FLOW-AUTH-IDE'
dependsOn: []
implementedIn:
  - 'vscode-extension/src/githubAuth.ts'
verifiedIn:
  - 'tests/e2e/auth.spec.ts'
  - 'tests/vscode-github-auth-persistence.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
  - 'INV-AUTH-PERSISTENCE'
minCoverage: 100
---

# IDE Native Authentication Session Provider

## Overview

Utilizes vscode.authentication.getSession alongside multi-tier fallback resolution (native session, context secrets, global storage, process.env, and gh CLI) to automatically leverage active GitHub accounts in VS Code, Cursor, and Antigravity IDE while persisting authentication state across sessions.

## User Journey (Gherkin Scenarios)

- Given an active IDE workspace with GitHub login or environment tokens
- When the extension activates
- Then user credentials and avatar are fetched seamlessly across reloads without manual token input
- And authentication state changes are broadcast reactively to markdown preview panels
