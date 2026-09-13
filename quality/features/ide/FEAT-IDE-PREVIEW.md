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
  - 'vscode-extension/media/earlyHook.js'
  - 'vscode-extension/media/preview.js'
  - 'vscode-extension/media/preview.css'
  - 'vscode-extension/media/previewActions.js'
  - 'vscode-extension/media/preview-webview.js'
  - 'vscode-extension/media/previewSidebar.js'
  - 'vscode-extension/media/inlineAnchors.js'
  - 'vscode-extension/media/vscode-markdown.css'
  - 'vscode-extension/src/markdownItPlugin.ts'
  - 'vscode-extension/src/markdownRender.ts'
  - 'vscode-extension/src/commentPreviewPanel.ts'
  - 'vscode-extension/src/commentStore.ts'
  - 'vscode-extension/src/optimisticStore.ts'
  - 'vscode-extension/src/commentActions.ts'
  - 'vscode-extension/src/extension.ts'
verifiedIn:
  - 'tests/vscode-markdown-plugin.test.ts'
  - 'tests/vscode-document-comments.test.ts'
  - 'tests/vscode-optimistic-actions.test.ts'
  - 'tests/vscode-preview-infinite-loop.test.ts'
  - 'tests/vscode-native-preview-actions.test.ts'
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
  - 'tests/e2e/vscode-real-repo-sequential-delete.spec.ts'
invariants:
  - 'INV-XSS-SANITIZED'
  - 'INV-IN-PLACE-PREVIEW'
  - 'INV-MUTATION-GUARD'
  - 'INV-MODAL-CONFIRMATION'
minCoverage: 100
---

# Desktop IDE Markdown Preview In-Situ Decorator

## Overview

Hooks into the IDE's Markdown rendering pipeline to provide rich GitHub/VS Code typography styling, syntax highlighting, synchronous bootstrap hooking (`earlyHook.js`), in-place DOM patching, and an in-situ comments drawer toggled via the floating MD FAB widget.

## User Journey (Gherkin Scenarios)

- Given a Markdown preview pane open in the IDE
- When the markdown engine parses the document tokens
- Then early bootstrap hook intercepts acquireVsCodeApi and prepares action dispatchers
- And typography styles matching the active VS Code theme and syntax highlighting are applied
- And anchored comments are injected alongside an interactive floating MD FAB toggle
- When a user clicks the MD FAB widget in the preview
- Then the comments sidebar drawer slides open smoothly
- When a user adds, replies to, edits, or reacts to comments
- Then comment cards and badges update in-place optimistically without document DOM reloading
- When a user initiates comment or reply deletion
- Then an in-webview confirmation modal prompts for confirmation and prevents resurrection via optimistic tombstones
