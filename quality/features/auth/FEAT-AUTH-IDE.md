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
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# IDE Native Authentication Session Provider

## Overview

Utilizes vscode.authentication.getSession to automatically leverage active GitHub accounts in VS Code, Cursor, and Antigravity IDE.

## User Journey (Gherkin Scenarios)

- Given an active IDE workspace with GitHub login
- When the extension activates
- Then user credentials and avatar are fetched seamlessly without manual token input
