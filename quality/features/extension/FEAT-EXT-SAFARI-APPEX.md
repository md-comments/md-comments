---
id: 'FEAT-EXT-SAFARI-APPEX'
title: 'Native macOS Companion App and Safari App Extension Bundle Lifecycle'
category: 'extension'
interfaces:
  - 'safari-appex'
flowId: 'FLOW-EXT-SAFARI-APPEX'
dependsOn:
  - 'FEAT-EXT-SAFARI-BUILD'
implementedIn:
  - 'safari-extension/src/App/main.swift'
  - 'safari-extension/src/Extension/SafariExtensionHandler.swift'
  - 'scripts/build-safari-app.sh'
verifiedIn:
  - 'tests/e2e/safari-extension.spec.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# Native macOS Companion App and Safari App Extension Bundle Lifecycle

## Overview

Wraps the Safari WebExtension in a native macOS companion application (`Markdown Comments.app`) and Safari App Extension (`.appex`), configured with App Sandbox and network client entitlements, supporting frictionless self-signed installation.

## User Journey (Gherkin Scenarios)

- Given the compiled Safari WebExtension resources
- When the native build pipeline packages the macOS bundle
- Then the `Markdown Comments Extension.appex` is embedded in the application's `PlugIns/` directory
- And the bundle is ad-hoc signed so users can enable it with Safari's "Allow Unsigned Extensions"
