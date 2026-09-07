---
id: 'INV-ZERO-CLIENT-SECRETS'
description: 'Client extension bundles, desktop IDE plugins, and web widgets must never contain vendor API tokens, credentials, or Basic Auth headers.'
enforcementMechanism: 'Cloudflare Worker Telemetry Proxy architecture, static bundle analysis, and proxy integration assertions.'
---

# Invariant: Zero Client Secrets

Browser extension packages (Chrome, Safari), desktop IDE plugins (VS Code, Cursor, Antigravity), Obsidian plugin, and web embeds must never embed raw API tokens or authorization headers. All telemetry is routed through an unauthenticated Cloudflare Worker proxy that attaches credentials on the server side.
