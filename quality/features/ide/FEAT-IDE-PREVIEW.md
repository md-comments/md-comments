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
  - 'vscode-extension/src/markdownRender.ts'
  - 'vscode-extension/src/commentPreviewPanel.ts'
  - 'vscode-extension/media/vscode-markdown.css'
verifiedIn:
  - 'tests/vscode-markdown-plugin.test.ts'
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

Hooks into the IDE's Markdown rendering pipeline to provide rich GitHub/VS Code typography styling, syntax highlighting, and an in-situ comments drawer toggled via the floating MD FAB widget.

## User Journey (Gherkin Scenarios)

- Given a Markdown preview pane open in the IDE
- When the markdown engine parses the document tokens
- Then typography styles matching the active VS Code theme and syntax highlighting are applied
- And anchored comments are injected alongside an interactive floating MD FAB toggle
- When a user clicks the MD FAB widget in the preview
- Then the comments sidebar drawer slides open smoothly
- When a user adds, replies to, or reacts to comments
- Then comment cards and thread updates persist and refresh live
