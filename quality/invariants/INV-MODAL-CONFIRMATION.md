---
id: 'INV-MODAL-CONFIRMATION'
description: 'High-impact actions like thread deletion in native preview use resilient in-preview modal confirmation rather than disruptive or blocking system prompts.'
enforcementMechanism: 'E2E tests in tests/e2e/vscode-real-repo-sequential-delete.spec.ts verifying showConfirmationModal execution and stopPropagation handling.'
---

# Invariant: In-Preview Modal Confirmation

Destructive user operations within native preview webviews—specifically deleting comment threads or replies—must invoke an in-situ HTML confirmation modal (`showConfirmationModal`). Relying on native IDE modal boxes or prompt inputs disrupts keyboard focus, breaks webview state synchronicity, and leads to accidental sequential deletions. Click events on deletion triggers must stop propagation to prevent unintentional navigation.
