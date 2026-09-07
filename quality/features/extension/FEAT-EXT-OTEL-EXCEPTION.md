---
id: 'FEAT-EXT-OTEL-EXCEPTION'
title: 'OpenTelemetry Exception Logging & Zero-Secret Closed-Loop Remediation'
category: 'extension'
interfaces:
  - 'chrome-mv3'
  - 'safari-extension'
  - 'vscode-extension'
  - 'obsidian-plugin'
  - 'embed-js'
flowId: 'FLOW-OTEL-TELEMETRY'
dependsOn: []
implementedIn:
  - 'shared/src/telemetry/client.ts'
  - 'shared/src/telemetry/sanitizer.ts'
  - 'shared/src/telemetry/killswitch.ts'
  - 'chrome-extension/src/telemetry/contentTelemetry.ts'
  - 'chrome-extension/src/telemetry/otelBackground.ts'
verifiedIn:
  - 'tests/sharedTelemetry.test.ts'
  - 'tests/extensionTelemetry.test.ts'
  - 'tests/safariTelemetry.test.ts'
  - 'tests/ideTelemetry.test.ts'
  - 'tests/telemetryProxy.test.ts'
invariants:
  - 'INV-ZERO-CLIENT-SECRETS'
  - 'INV-QUOTA-DEFENSE'
  - 'INV-ZERO-CUSTOMER-DATA'
  - 'INV-TELEMETRY-KILLSWITCH'
minCoverage: 100
---

# OpenTelemetry Exception Logging & Zero-Secret Closed-Loop Remediation

## Overview

Captures runtime exceptions and unhandled promise rejections across client interfaces, scrubs all PII and customer data, normalizes stack traces across V8 and JavaScriptCore, and dispatches sanitized diagnostic records via a Cloudflare Worker proxy to upstream APM backends with zero client secrets.

## User Journey (Gherkin Scenarios)

- Given a browser extension, desktop IDE, or plugin encountering an unhandled runtime error
- When the error boundary intercepts the exception
- Then customer data, tokens, and local paths are scrubbed completely (INV-ZERO-CUSTOMER-DATA)
- And the record is dispatched to the Cloudflare Worker without client credentials (INV-ZERO-CLIENT-SECRETS)
- When telemetry is toggled off in settings
- Then all local queues are purged immediately and zero network calls are made (INV-TELEMETRY-KILLSWITCH)
