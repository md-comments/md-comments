# Test Enhancement & Knowledge Graph Co-Evolution Rule

## Core Directive

Every time a change is **planned**, **proposed**, or **made** in this repository:

1. **Tests MUST be enhanced**: Never write, modify, or refactor application code without adding or updating corresponding tests in `tests/`.
2. **Knowledge Graph MUST be updated**: When new features, flows, UI interactions, or invariants are touched or introduced, update the in-code Knowledge Graph in `shared/knowledge-graph/` (`schema.ts`, `registry.ts`).
3. **100% Coverage MUST be preserved**: Run `pnpm test:coverage` and ensure statements, branches, functions, and lines maintain 100% coverage gates.

## When Planning Changes (`.plans/` & RFCs)

Any implementation plan or architecture proposal must include a dedicated **Test Enhancement & Knowledge Graph Specification** detailing:

- The exact test cases (Unit, Integration, and Headless Playwright E2E) to be added.
- The corresponding `FeatureNode`, `FlowNode`, or `InvariantNode` entries to be registered in the Knowledge Graph.
- Adherence to core architectural invariants including `INV-NO-PAT` (Zero PAT in GitHub Extension tests/fixtures).
- Pre-flight test environment requirements (repo fixtures, mock handlers).

Plans without explicit test enhancement deliverables are invalid and cannot be approved.

## When Implementing Code Changes

- **Co-Evolution**: Always commit test files alongside source code changes.
- **Run Graph Linter**: Run `pnpm test tests/knowledgeGraph.test.ts` to confirm there are no orphaned feature nodes or broken flow transitions.
- **Run Full Diagnostics**: Execute `pnpm check` before staging commits.
