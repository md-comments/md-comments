---
id: 'INV-MUTATION-GUARD'
description: 'DOM badge and counter updates in preview must guard text assignments by strict equality to prevent MutationObserver recursive loops pegging the renderer.'
enforcementMechanism: 'Unit test suite tests/vscode-preview-infinite-loop.test.ts asserting textContent equality checking in preview event observers.'
---

# Invariant: MutationObserver Text Equality Guard

When observing DOM mutations or updating comment badge counts in webview preview contexts, the script must verify that `element.textContent !== newContent` before performing assignments. Direct unconditioned assignments re-trigger the MutationObserver callback, resulting in an infinite recursive mutation storm that saturates the renderer process CPU at 100%.
