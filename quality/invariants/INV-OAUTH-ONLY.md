---
id: 'INV-OAUTH-ONLY'
description: 'All clients must authenticate exclusively via OAuth (Device Flow RFC 8628, Native IDE provider, or OAuth Proxy) without persisting personal access tokens in browser extensions.'
enforcementMechanism: 'Static analysis, ESLint rules, and authentication integration test assertions.'
---

# Invariant: OAuth Only Authentication

Browser extensions and IDE integrations must never request, store, or persist raw GitHub Personal Access Tokens (PATs). All authentication lifecycles must use OAuth Device Authorization Flow (RFC 8628) or IDE native session providers.
