---
id: 'INV-QUOTA-DEFENSE'
description: 'The edge telemetry proxy must enforce IP rate-limiting and payload size caps to shield upstream free-tier APM quotas from abuse.'
enforcementMechanism: 'Cloudflare Worker in-memory sliding window rate-limiter, 64KB body size checks, and Vitest proxy test suite.'
---

# Invariant: Quota & Abuse Defense

The telemetry proxy must strictly rate-limit client traffic to a maximum threshold (default 20 requests per minute per IP) and reject payloads exceeding 64KB to guarantee upstream quotas cannot be exhausted by bad actors or infinite loop storms.
