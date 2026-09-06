---
id: 'FEAT-IDE-CODELENS'
title: 'Desktop IDE CodeLens Comment Counter Badges'
category: 'ide'
interfaces:
  - 'vscode'
  - 'cursor'
  - 'antigravity'
flowId: 'FLOW-IDE-CODELENS'
dependsOn:
  - 'FEAT-AUTH-IDE'
implementedIn:
  - 'vscode-extension/src/codeLensProvider.ts'
verifiedIn:
  - 'tests/vscodeStorage.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Desktop IDE CodeLens Comment Counter Badges

## Overview

Displays interactive CodeLens badges above markdown paragraphs in desktop IDE editors (VS Code, Cursor, Antigravity) indicating active comment counts and triggering comment navigation.

## User Journey (Gherkin Scenarios)

- Given a Markdown file open in an AI IDE editor with active comments
- When the CodeLens provider processes document anchors
- Then inline indicators appear above sections showing comment counts
- When the user clicks the CodeLens badge
- Then the comments panel opens focused on that section
