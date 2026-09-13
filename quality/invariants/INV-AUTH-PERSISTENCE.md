---
id: 'INV-AUTH-PERSISTENCE'
description: 'VS Code extension auth state persists across window reloads via context.globalState and emits reactive onDidChangeAuthState events.'
enforcementMechanism: 'Unit test suite tests/vscode-github-auth-persistence.test.ts verifying globalState synchronization and event firing on auth transitions.'
---

# Invariant: Authentication Persistence & Reactivity

GitHub authentication states resolved through active IDE sessions, environment variables, or RFC 8628 Device Code Flows must persist across window reloads and extension restarts using `context.globalState`. State modifications must immediately broadcast across the extension host and active preview webviews via `onDidChangeAuthState` event emitters.
