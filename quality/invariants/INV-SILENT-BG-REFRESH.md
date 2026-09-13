---
id: 'INV-SILENT-BG-REFRESH'
description: 'Background synchronization must execute silently without disruptive toasts or UI focus stealing.'
enforcementMechanism: 'Unit test suite tests/refreshBackgroundSync.test.ts asserting background sync loops execute without showing notifications.'
---

# Invariant: Silent Background Synchronization

Routine background polling, remote Git ref synchronization, and comment refresh cycles must execute silently in the background. Extensions and plugins must never pop intrusive notification toasts, steal keyboard or window focus, or interrupt the user while typing or reviewing documents. Only explicit user-initiated manual sync failures may surface notifications.
