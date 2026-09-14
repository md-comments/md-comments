---
id: 'INV-NO-THIRD-PARTY-AUTH-PROXY'
description: 'Authentication requests must never be routed through unverified third-party CORS proxies or unauthorized relays.'
enforcementMechanism: 'Hardcoded endpoint enforcement, URL validation in client auth managers, and Vitest assertions against third-party proxy relays.'
---

# Invariant: No Third-Party Authentication Proxy

OAuth Device Flow authorization codes, tokens, and credentials must never transit through untrusted third-party CORS proxies (e.g. proxy.cors.sh). All network traffic must connect directly to official GitHub OAuth endpoints (`https://github.com/login/*`) or dedicated first-party proxy middlewares with origin verification.
