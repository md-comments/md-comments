---
id: 'FEAT-DOCS-ARCH'
title: 'Living Architecture Documentation & Drift Defense'
category: 'docs'
interfaces:
  - 'docs'
  - 'ci'
  - 'cli'
flowId: 'FLOW-DOCS-ARCH-MAINTENANCE'
dependsOn: []
implementedIn:
  - 'scripts/verify-architecture-docs.mjs'
  - 'scripts/generate-architecture-assets.mjs'
  - 'docs/architecture/README.md'
  - 'docs/architecture/c4-architecture.md'
  - 'docs/architecture/c4/model.c4'
  - 'docs/architecture/c4/views.c4'
  - 'docs/architecture/data-flow-diagrams.md'
  - 'docs/architecture/components-integration.md'
  - 'docs/architecture/sequence-diagrams.md'
  - 'docs/architecture/invariants-and-adrs.md'
  - '.agents/skills/architecture-docs/SKILL.md'
  - '.agents/workflows/architecture-sync.md'
verifiedIn:
  - 'tests/architectureDocs.test.ts'
invariants:
  - 'INV-VISUAL-PARITY'
  - 'INV-ZERO-CLIENT-SECRETS'
  - 'INV-OAUTH-ONLY'
  - 'INV-IN-PLACE-PREVIEW'
  - 'INV-MUTATION-GUARD'
  - 'INV-BASE-TREE-SHA'
  - 'INV-AUTH-PERSISTENCE'
  - 'INV-MODAL-CONFIRMATION'
minCoverage: 100
---

# Living Architecture Documentation & Drift Defense

## Overview

Comprehensive multi-layer architecture documentation and automated drift defense suite covering LikeC4 C4 models, D2 (ELK) data flow and component integration diagrams, runtime sequence diagrams, and 14 system invariants.

## User Journey (Gherkin Scenarios)

- Given a developer or AI agent modifying monorepo packages or preview components
- When architecture models or diagrams drift from source implementations
- Then pre-commit gates and CI checks flag discrepancies immediately via verify:arch
- And LikeC4 models and D2 diagrams are validated offline
- And system invariants are formally verified against codebase implementations
