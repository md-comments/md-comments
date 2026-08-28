---
name: pre-commit-checks
description: >
  Instruction skill to run lint, format, typecheck, unit tests, and SCA (dependency audit) before committing.
  Triggers on "run checks", "pre-commit", "before committing", "run lint", "run sca", or when preparing to commit.
---

When preparing to commit code, staging files, or writing commit messages, you MUST run the suite of quality and security checks to ensure no regressions or vulnerabilities are introduced.

## Required Checks

Run the following checks from the root directory:

1. **Dependency Audit (SCA)**:

   ```bash
   pnpm audit --prod --audit-level high
   ```

   _Checks for vulnerable dependencies using pnpm's audit mechanism._

2. **Linting (SAST / Code Quality)**:

   ```bash
   pnpm lint
   ```

   _Runs ESLint with security-oriented rules across the workspace._

3. **Formatting (Auto-Fix & Verify)**:

   Always run the formatting script to auto-fix and check formatting:

   ```bash
   pnpm format
   ```

   _This automatically formats files using Prettier. Any formatted files must be restaged (e.g., `git add .` or specifically adding the files) before committing._

4. **TypeScript & Astro Static Typecheck**:

   ```bash
   pnpm typecheck
   ```

   _Ensures compiler-level type safety across all workspace projects (`shared`, `vscode-extension`, `obsidian-plugin`, `chrome-extension`, `starlight-plugin`, `demo-astro`, and test files)._

5. **Unit Tests**:

   ```bash
   pnpm test
   ```

   _Runs Vitest tests to ensure regressions are not introduced._

6. **Production Build verification**:

   ```bash
   pnpm build
   ```

   _Verifies that the bundles for all extensions and integrations (`vscode-extension`, `chrome-extension`, `obsidian-plugin`, `@md-comments/starlight`, `demo-astro`) successfully compile._

> [!TIP]
> You can run the entire diagnostic suite in a single command with `pnpm check`.

7. **FOSSA Scan (SCA / License & Vulnerability Compliance)**:
   ```bash
   FOSSA_API_KEY=<your-key> fossa analyze
   ```
   _Runs FOSSA analysis to scan for license compliance and third-party vulnerabilities. Ensure your FOSSA API key is exported or provided._

## Execution Workflow

1. **Pre-Commit Assessment**: Before finalizing any commit or calling a commit helper (e.g., `caveman-commit`), run the commands listed above.
2. **Success Requirement**: All checks must pass. If any check fails, do not commit. Address the issues, run the verification checks again, and verify they pass.
3. **Auto-Fixing**: Always run `pnpm format` to automatically resolve formatting discrepancies. If any files were modified by the formatter, make sure to stage them (`git add`) before committing.
