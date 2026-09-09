# Full Regression Suite Before Version Bump

## Core Directive

Before bumping any version numbers across the repository, cutting a release branch, or preparing a release PR:

1. **Mandatory Full Regression**: The complete regression test suite (diagnostic checks, typechecks, unit test coverage, and end-to-end suites) MUST be executed and pass with zero failures before modifying any version strings or manifest files.
2. **Zero Version Bump on Failure**: If any regression check fails, errors, or exhibits flaky behavior, **DO NOT** bump version numbers. Resolve the underlying root cause, restage fixes, and re-run the full regression suite until green.
3. **Scope of Manifests**: This rule applies whenever bumping versions in:
   - Root `package.json`
   - `vscode-extension/package.json`
   - `chrome-extension/manifests/chrome/manifest.json`
   - `chrome-extension/manifests/safari/manifest.json`
   - `obsidian-plugin/manifest.json`
   - `shared/package.json`
   - `starlight-plugin/package.json`
   - `demo-astro/package.json`
   - Telemetry `serviceVersion` declarations across packages

---

## Required Regression Suite

Execute the regression suite from the workspace root:

### 1. Workspace Diagnostic Gate

```bash
pnpm check
```

Verifies:

- Production dependency vulnerability audit (`pnpm audit --prod --audit-level high`)
- Cross-platform packaging compatibility (`pnpm verify:packaging`)
- Zero-warning lint (`pnpm lint`)
- Prettier format compliance (`pnpm format:check`)
- TypeScript & Astro static typechecking across all packages (`pnpm typecheck`)
- Full production compilation of all extensions and packages (`pnpm build`)
- Unit test suite maintaining 100% coverage gates (`pnpm test:coverage`)

### 2. Knowledge Graph & Quality Graph Integrity

```bash
pnpm test tests/qualityGraph.test.ts tests/knowledgeGraph.test.ts
```

Verifies that all feature nodes, flow transitions, and architectural invariants remain valid and synchronized.

### 3. End-to-End (E2E) Regression Suite

```bash
pnpm test:e2e
```

Runs Playwright E2E suites across Chromium headless and WebKit (including Safari extension, embedded comment widgets, Astro/Starlight integration, and hermetic GitHub extension flows).

_(Where supported or in CI environments with Xvfb/display, also verify VS Code Electron E2E: `pnpm test:e2e:vscode`)_

### 4. CodeGraph Status

```bash
codegraph status
```

Ensures code graph indices are cleanly synchronized with the active codebase.

---

## Convenience Command

Run the consolidated regression command:

```bash
pnpm test:regression
```

All checks must exit with code 0 before any version bump commit or edit is staged.
