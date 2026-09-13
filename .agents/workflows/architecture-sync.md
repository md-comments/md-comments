---
name: architecture-sync
description: Verify and synchronize LikeC4 models, D2 diagrams, and architecture documentation
---

# Workflow: architecture-sync

Use this workflow to audit, validate, and synchronize the architecture documentation suite with codebase modifications.

1. **Verify Architecture Drift**:
   ```bash
   pnpm verify:arch
   ```
2. **Validate LikeC4 Models**:
   ```bash
   pnpm likec4 validate --no-layout docs/architecture/c4
   ```
3. **Run Architecture Test Suite**:
   ```bash
   pnpm test tests/architectureDocs.test.ts
   ```
4. **Rebuild Quality Knowledge Graph**:
   ```bash
   pnpm quality:build
   ```
5. **Inspect or Preview Models Interactively (Optional)**:
   ```bash
   pnpm likec4 start docs/architecture/c4
   ```
