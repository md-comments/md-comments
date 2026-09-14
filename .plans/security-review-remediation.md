# Security Review Remediation & OWASP Top 10 Hardening Plan

[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)

## Overview & Objectives

Following the Product Security (Pwn Patrol) review for Markdown Comments (`PRODSECKB-6778` / `GRM-10869`), this implementation plan addresses all 9 identified security findings (1 High, 3 Medium, 5 Low) across the monorepo, plus discovered similar vulnerabilities and OWASP Top 10 hardening opportunities.

### Key Objectives

1. **Remediate All Audit Findings**: Fix the 1 High, 3 Medium, and 5 Low vulnerabilities identified in the security review.
2. **Monorepo-Wide Similar & OWASP Top 10 Hardening**: Resolve identical patterns discovered across clients (Obsidian unescaped quotes, Chrome extension unescaped error strings, Obsidian/Chrome extension unvalidated `yaml.load`, and client API URL interpolations).
3. **Commit Atomicity**: Package each issue remediation into a separate, focused commit with conventional commit messages and dedicated regression tests.
4. **Enforce Architectural Invariants & Quality Knowledge Graph**:
   - Register new invariants in `quality/invariants/` (`INV-NO-THIRD-PARTY-AUTH-PROXY`, `INV-SAFE-DESERIALIZATION`, `INV-INPUT-VALIDATION-REPO`).
   - Preserve zero-PAT invariant for the browser extension (`INV-NO-PAT`).
   - Update `.agents/skills/pre-commit-checks/SKILL.md` with explicit SAST and OWASP Top 10 verification steps.
5. **100% Coverage Gate**: Maintain strict test coverage thresholds across all packages without regressing existing test suites.

---

## Findings & Commit Map

| Finding ID | Severity                | Description                                                                                                  | Target Component                                         | Proposed Commit                                                                                     |
| :--------- | :---------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **SEC-01** | **High**                | OAuth tokens routed through third-party open CORS proxy `proxy.cors.sh`                                      | Starlight Plugin, Demo HTML Embed, Mock Demo             | `fix(security): remove proxy.cors.sh third-party oauth relay fallback`                              |
| **SEC-02** | **Medium**              | Stored XSS in Obsidian resolved-summary excerpt (`sidebarView.ts:488`) and anchor quote (`:373`)             | Obsidian Plugin                                          | `fix(security): escape comment body excerpt and anchor quotes in obsidian sidebar`                  |
| **SEC-03** | **Medium**              | Stored XSS via unescaped GitHub display name in Obsidian (`sidebarView.ts:434, :465, :486`)                  | Obsidian Plugin                                          | `fix(security): escape author display names in obsidian sidebar view`                               |
| **SEC-04** | **Medium**              | OAuth token stored in `localStorage` in web clients (`githubAuth.ts:40`, `md-comments.js:641`)               | Starlight Plugin, HTML Embed, Documentation              | `fix(security): mitigate token storage exposure in web clients and document security boundaries`    |
| **SEC-05** | **Low**                 | OAuth scope `repo` is broader than necessary (`githubAuth.ts:147`, `:162`)                                   | VS Code Extension, Chrome Extension, HTML Embed          | `fix(security): implement least-privilege oauth scopes with configurable permissions`               |
| **SEC-06** | **Low**                 | `yaml.load()` without explicit safe schema (`gitRefBackend.ts:170, :341`, `storage.ts:99`, `content.ts:656`) | Shared GitRef Backend, Obsidian Plugin, Chrome Extension | `fix(security): enforce safe json schema on yaml parsing across monorepo`                           |
| **SEC-07** | **Low**                 | Dev auth proxy open CORS + body forwarding (`authProxy.ts:22`)                                               | Starlight Plugin Dev Server                              | `fix(security): restrict dev auth proxy cors origins and validate forwarded payload schema`         |
| **SEC-08** | **Low**                 | Broad Chrome host permission `https://*.workers.dev/*` (`manifest.json:11`)                                  | Chrome & Safari Extension Manifests                      | `fix(security): narrow extension manifest host permissions to dedicated telemetry worker`           |
| **SEC-09** | **Low**                 | Unvalidated URL interpolation in Git-ref backend (`gitRefBackend.ts:150`)                                    | Shared GitRef Backend, Chrome Extension API              | `fix(security): validate repository owner and name against path traversal in api url interpolation` |
| **SEC-10** | **OWASP**               | Unescaped error messages in Chrome extension DOM rendering (`content.ts:1422, :2722, :2751, :4179, :4193`)   | Chrome Extension                                         | `fix(security): escape error messages in chrome extension and harden client dom rendering`          |
| **SEC-11** | **Invariants & Skills** | New security invariants, skill updates, and quality graph sync                                               | Agents Skills, Quality Invariants, Velite Catalog        | `feat(security): register security invariants, update pre-commit skills, and sync quality graph`    |

---

## Detailed Milestone Execution Plan

### Milestone 1: High-Severity Fix — Remove `proxy.cors.sh` Relay (Commit 1)

- **Problem**: `starlight-plugin/src/client/githubAuth.ts` and `website/demo-html/embed/md-comments.js` (and mock demo) query `https://proxy.cors.sh/https://github.com/...` if local proxy fails. Third-party CORS relays can harvest OAuth device tokens or inject malicious tokens.
- **Remediation**:
  - Remove `proxy.cors.sh` entirely from candidates in `starlight-plugin/src/client/githubAuth.ts`, `website/demo-html/embed/md-comments.js`, and `website/demo-mock/embed/md-comments.js`.
  - Starlight plugin auth falls back cleanly to providing explicit setup guidance if no first-party proxy (`oauthProxyUrl`) or dev server proxy is reachable.
  - Update `tests/starlight-plugin.test.ts` to assert `proxy.cors.sh` is never invoked and verify graceful error messaging.
- **Commit Message**: `fix(security): remove proxy.cors.sh third-party oauth relay fallback`

### Milestone 2: Obsidian Stored XSS — Resolved Excerpt & Anchor Quotes (Commit 2)

- **Problem**: `obsidian-plugin/src/sidebarView.ts:488` interpolates `comment.body.slice(0, 45)` directly into `innerHTML`. Furthermore, line 373 interpolates `quote` (from `comment.anchor_text`) without HTML escaping into `<blockquote>`.
- **Remediation**:
  - In `obsidian-plugin/src/sidebarView.ts`:
    - Wrap excerpt: `${escapeHtml(comment.body.slice(0, 45))}${comment.body.length > 45 ? '...' : ''}`.
    - Wrap quote text: `${escapeHtml(quote)}`.
  - Create new unit test suite `tests/obsidian-xss.test.ts` testing XSS injection strings in comment body excerpts and anchor quotes.
- **Commit Message**: `fix(security): escape comment body excerpt and anchor quotes in obsidian sidebar`

### Milestone 3: Obsidian Stored XSS — GitHub Display Name (Commit 3)

- **Problem**: `obsidian-plugin/src/sidebarView.ts:434, :465, :486` interpolates `this.resolveDisplayName(...)` directly into `innerHTML`. An attacker setting their GitHub profile display name to `<img src=x onerror=...>` executes code in the Obsidian renderer when any user views their comment.
- **Remediation**:
  - Ensure all author display name render sites wrap with `escapeHtml(this.resolveDisplayName(...))` or sanitize before insertion.
  - Verify `resolveDisplayName` output escaping in `sidebarView.ts`.
  - Add test in `tests/obsidian-xss.test.ts` testing author display names with HTML payloads.
- **Commit Message**: `fix(security): escape author display names in obsidian sidebar view`

### Milestone 4: Web Client Token Storage Mitigation & Docs (Commit 4)

- **Problem**: `starlight-plugin/src/client/githubAuth.ts` and `website/demo-html/embed/md-comments.js` persist GitHub OAuth tokens in `localStorage`. Any XSS on the host documentation site can read and exfiltrate the token.
- **Remediation**:
  - Support `sessionStorage` fallback / option for ephemeral browsing sessions instead of persistent `localStorage`.
  - Add explicit token clearance and expiration handling.
  - Update `SECURITY.md` and Starlight/Embed documentation with security posture guidance: document that client-side tokens on static sites are subject to same-origin risk, recommend strict CSP headers, and document backend proxy architecture with HttpOnly cookies as the enterprise pattern.
  - Add tests in `tests/starlight-plugin.test.ts` verifying token storage options and clearing.
- **Commit Message**: `fix(security): mitigate token storage exposure in web clients and document security boundaries`

### Milestone 5: Least-Privilege OAuth Scopes (Commit 5)

- **Problem**: `vscode-extension/src/githubAuth.ts:147`, `chrome-extension/src/githubAuth.ts:162`, and `embed/md-comments.js` request broad `public_repo repo` scopes.
- **Remediation**:
  - Make OAuth scope configurable across clients, defaulting to `public_repo` for public repositories.
  - In VS Code extension, add configuration `markdownComments.oauthScope` defaulting to `public_repo` with option for `repo` when collaborating on private repositories.
  - In Chrome extension, request `public_repo` by default, retaining seamless frictionless auth (`INV-NO-PAT`).
  - Document recommended GitHub App with repository rulesets in `SECURITY.md` as the least-privilege private repository pattern.
  - Add unit tests in `tests/chromeAuth.test.ts` and `tests/vscode-github-auth-persistence.test.ts`.
- **Commit Message**: `fix(security): implement least-privilege oauth scopes with configurable permissions`

### Milestone 6: Monorepo-Wide Safe YAML Schema (Commit 6)

- **Problem**: `yaml.load()` in `shared/gitRefBackend.ts:170, :341`, `obsidian-plugin/src/storage.ts:99`, and `chrome-extension/src/content.ts:656` parses untrusted collaborator YAML without `{ schema: yaml.JSON_SCHEMA }`.
- **Remediation**:
  - In `shared/gitRefBackend.ts`, pass `{ schema: yaml.JSON_SCHEMA }` to `yaml.load`.
  - In `obsidian-plugin/src/storage.ts`, pass `{ schema: yaml.JSON_SCHEMA }` to `yaml.load`.
  - In `chrome-extension/src/content.ts`, pass `{ schema: yaml.JSON_SCHEMA }` to `yaml.load`.
  - Export a shared helper `safeLoadYaml<T>(text: string): T` in `shared/` with strict schema validation.
  - Add tests in `tests/gitRefBackend.test.ts` testing resilience against YAML aliases and exotic custom types.
- **Commit Message**: `fix(security): enforce safe json schema on yaml parsing across monorepo`

### Milestone 7: Dev Auth Proxy CORS & Body Validation (Commit 7)

- **Problem**: `starlight-plugin/src/server/authProxy.ts:22` sets `Access-Control-Allow-Origin: *` and relays arbitrary request bodies verbatim to GitHub.
- **Remediation**:
  - Restrict `Access-Control-Allow-Origin` to localhost/127.0.0.1 or the local dev server origin; reject external origins.
  - Validate body schema strictly:
    - `/device-code`: only allow `client_id`, `scope`.
    - `/access-token`: only allow `client_id`, `device_code`, `grant_type`.
  - Reject requests with unexpected parameters with HTTP 400 Bad Request.
  - Add tests in `tests/starlight-plugin.test.ts`.
- **Commit Message**: `fix(security): restrict dev auth proxy cors origins and validate forwarded payload schema`

### Milestone 8: Narrow Chrome Extension Host Permissions (Commit 8)

- **Problem**: `chrome-extension/manifest.json:11`, `manifests/manifest.chrome.json:11`, and `manifests/manifest.safari.json:11` declare broad host permission `"https://*.workers.dev/*"`.
- **Remediation**:
  - Narrow host permissions to the concrete telemetry worker domain:
    `"https://*.md-comments.workers.dev/*"`.
  - Update `tests/e2e/otel-extension.spec.ts:32` to assert against the narrowed permission.
- **Commit Message**: `fix(security): narrow extension manifest host permissions to dedicated telemetry worker`

### Milestone 9: Validate Repository Identifiers in API URLs (Commit 9)

- **Problem**: `shared/gitRefBackend.ts:150` interpolates `owner` and `repo` directly into GitHub API endpoints without validation against `/^[\w.-]+$/`.
- **Remediation**:
  - Introduce `validateGitHubIdentifier(name: string, label: string): void` in `shared/` asserting `/^[\w.-]+$/`.
  - Enforce validation at the top of all public methods in `GitRefBackend` (`read`, `write`, `deleteFileFromRef`, `fetchPathContent`, etc.) and `chrome-extension/src/githubApi.ts`.
  - Throw clear errors if path traversal tokens (`..`, `/`, `%2e%2e`) or invalid characters are detected.
  - Add unit tests in `tests/gitRefBackend.test.ts` validating rejection of malicious repo/owner names.
- **Commit Message**: `fix(security): validate repository owner and name against path traversal in api url interpolation`

### Milestone 10: Chrome Extension Error Rendering Hardening (Commit 10)

- **Problem**: In `chrome-extension/src/content.ts` (lines 1422, 2722, 2751, 4179, 4193), dynamic error messages and descriptions are interpolated directly into `innerHTML`.
- **Remediation**:
  - Ensure all error display elements use `escapeHtml(err)` or use DOM `.textContent`.
  - Add tests verifying error display escaping.
- **Commit Message**: `fix(security): escape error messages in chrome extension and harden client dom rendering`

### Milestone 11: Security Invariants, Skills, and Quality Graph Sync (Commit 11)

- **Problem**: Security rules and invariants must be formalized in the repo's knowledge graph and pre-commit skills to prevent future regressions.
- **Remediation**:
  - Create new quality invariants under `quality/invariants/`:
    - `INV-NO-THIRD-PARTY-AUTH-PROXY.md`
    - `INV-SAFE-DESERIALIZATION.md`
    - `INV-INPUT-VALIDATION-REPO.md`
  - Update `quality/features/` to link to these invariants and tests.
  - Update `.agents/skills/pre-commit-checks/SKILL.md` to incorporate SAST, security audits, and OWASP Top 10 verification.
  - Run `pnpm quality:build`, `pnpm test tests/qualityGraph.test.ts`, and full verification suite (`pnpm check`).
- **Commit Message**: `feat(security): register security invariants, update pre-commit skills, and sync quality graph`

---

## Mandatory Test Enhancement & Knowledge Graph Specification

### New Tests to Create

1. `tests/obsidian-xss.test.ts`:
   - Unit tests checking HTML escaping of `comment.body.slice(0, 45)` in resolved summary collapse.
   - Unit tests checking HTML escaping of `quote` in blockquotes.
   - Unit tests checking HTML escaping of author display names (`resolveDisplayName`).
2. `tests/gitRefBackend.test.ts` (New test cases):
   - Validation tests asserting that `validateGitHubIdentifier` rejects path traversal (`../`, `/`, spaces, newlines, null bytes).
   - Safe deserialization tests ensuring `yaml.load` with `JSON_SCHEMA` safely rejects YAML entity expansions, arbitrary JS classes, and unexpected types.
3. `tests/starlight-plugin.test.ts` (New test cases):
   - Assertion that `proxy.cors.sh` is not called and setup instructions are provided when no proxy is found.
   - Dev auth proxy tests asserting that external non-local CORS origins are rejected.
   - Dev auth proxy tests asserting that arbitrary body fields are stripped or rejected with HTTP 400.
   - Token storage lifecycle tests asserting `sessionStorage` option and clearing.
4. `tests/chromeAuth.test.ts` & `tests/vscode-github-auth-persistence.test.ts` (New test cases):
   - Test cases verifying least-privilege OAuth scope defaults (`public_repo`).
5. `tests/e2e/otel-extension.spec.ts`:
   - Updated assertion verifying narrowed host permission `https://*.md-comments.workers.dev/*`.

### Invariant Catalog Updates

- `quality/invariants/INV-NO-THIRD-PARTY-AUTH-PROXY.md`: Prohibits routing credentials through third-party unapproved CORS relays.
- `quality/invariants/INV-SAFE-DESERIALIZATION.md`: Enforces `JSON_SCHEMA` on all YAML deserialization.
- `quality/invariants/INV-INPUT-VALIDATION-REPO.md`: Mandates regex validation for GitHub owner/repo identifiers at API boundaries.

---

## Verification Plan

### Automated Checks

```bash
# 1. Monorepo linting & formatting
pnpm lint
pnpm format:check

# 2. Type checking across packages
pnpm typecheck

# 3. Unit & Integration tests with coverage
pnpm test
pnpm test:coverage

# 4. Quality Knowledge Graph integrity
pnpm quality:build
pnpm test tests/qualityGraph.test.ts

# 5. Architecture verification
pnpm verify:arch

# 6. Monorepo comprehensive check
pnpm check
```
