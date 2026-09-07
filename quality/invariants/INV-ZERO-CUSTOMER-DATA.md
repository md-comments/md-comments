---
id: 'INV-ZERO-CUSTOMER-DATA'
description: 'Zero customer data, markdown comments, repository code, personal notes, or PII is ever collected or transmitted. GDPR, CCPA, and data residency laws do not apply.'
enforcementMechanism: 'Technical allowlist schema, UniversalSanitizer multi-pattern regex scrubbing, and Vitest fuzz tests.'
---

# Invariant: Zero Customer Data & Regulatory Exemption

Under no circumstances is customer data, markdown comment text, document files, git diffs, or personal identities transmitted in telemetry. Telemetry is restricted strictly to non-identifiable technical machine diagnostics. As a result, GDPR, CCPA, and international data residency mandates do not apply.
