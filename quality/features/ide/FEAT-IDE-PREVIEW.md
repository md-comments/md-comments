---
id: 'FEAT-IDE-PREVIEW'
title: 'Desktop IDE Markdown Preview In-Situ Decorator'
category: 'ide'
interfaces:
  - 'vscode'
  - 'cursor'
  - 'antigravity'
flowId: 'FLOW-IDE-PREVIEW'
dependsOn:
  - 'FEAT-AUTH-IDE'
implementedIn:
  - 'vscode-extension/src/markdownItPlugin.ts'
verifiedIn:
  - 'tests/vscodeStorage.test.ts'
  - 'tests/e2e/vscode-extension-smoke.spec.ts'
  - 'tests/e2e/vscode-comment-preview.spec.ts'
  - 'tests/e2e/vscode-inline-anchors.spec.ts'
  - 'tests/e2e/vscode-thread-lifecycle.spec.ts'
  - 'tests/e2e/vscode-reactions.spec.ts'
  - 'tests/e2e/vscode-mentions.spec.ts'
  - 'tests/e2e/vscode-native-preview.spec.ts'
  - 'tests/e2e/vscode-search-drafts.spec.ts'
  - 'tests/e2e/vscode-codelens.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
minCoverage: 100
---

# Desktop IDE Markdown Preview In-Situ Decorator

## Overview

Hooks into the IDE's Markdown-it rendering pipeline to inject inline comment counters and reply previews directly inside the IDE Markdown Preview webview.

## User Journey (Gherkin Scenarios)

- Given a Markdown preview pane open in the IDE
- When the markdown-it plugin parses the document tokens
- Then anchored comments are injected as interactive HTML widgets
- When a user clicks a comment widget in the preview
- Then the comments edit panel or thread drawer activates
