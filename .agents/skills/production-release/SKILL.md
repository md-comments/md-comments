---
name: production-release
description: >
  Autonomous end-to-end procedure for cutting and publishing production releases, ensuring all manifests, telemetry, website download links, marketplace deployments, and live asset endpoints are verified in sequence.
  Triggers on "release", "production release", "publish release", "cut release", "release version", or when asked to bump and release.
---

# Autonomous Production Release Procedure

When the user asks to release (e.g. "release 1.3.3", "cut release", "publish release", "release"), execute the entire workflow **autonomously from start to finish**. Do not halt or prompt the user for intermediate steps (such as asking to commit, push, create branch, or promote); carry out the complete end-to-end sequence while providing clear milestone status updates.

---

## Release Invariants

1. **Mandatory Full Pre-Bump Regression Gate**:
   `pnpm test:regression` (or `pnpm check && pnpm test:e2e`) MUST pass with 0 errors before modifying any version strings or manifest files.
2. **Explicit Production Status**:
   Production releases MUST be published with `--prerelease=false --latest`. Never leave a published production release marked as a pre-release.
3. **Triggering Deployments via Release Edit**:
   Because staging releases are created as pre-releases by `github-actions[bot]`, promoting via `gh release edit` MUST include `--notes` and `--title` to ensure GitHub fires the `release: edited` event that triggers `.github/workflows/deploy-marketplaces.yml`:
   ```bash
   gh release edit v<VERSION> --prerelease=false --latest --title "Release v<VERSION>" --notes "Release v<VERSION>"
   ```
4. **Synchronize Website Download Links**:
   Every production release introduces new binaries/DMGs. The website (`website/index.html`) must be updated to reference the new release:
   - Target URL: `https://github.com/md-comments/md-comments/releases/download/v<VERSION>/Markdown-Comments-macOS.dmg`
   - `.github/workflows/deploy-marketplaces.yml` automatically verifies `website/index.html` and triggers `.github/workflows/deploy-pages.yml` upon release publication.
5. **Asset Completeness Verification**:
   Verify that all 4 distribution assets are attached and return HTTP 200:
   - `Markdown-Comments-macOS.dmg` (macOS Safari companion app)
   - `chrome-extension.zip` (Chrome Web Store)
   - `md-preview-comments-<VERSION>.vsix` (VS Code & Open VSX)
   - `obsidian-plugin.zip` (Obsidian)

---

## Autonomous Execution Sequence

Execute each step sequentially without stopping between phases:

### Step 1: Determine Target Version & Clean State

1. If the user specified a version (e.g. `1.3.3`), use it. If not, inspect the latest tag (`git describe --tags --abbrev=0`) and increment the patch version (or minor version if breaking changes/major features exist).
2. Ensure working tree is clean: `git status`.

### Step 2: Mandatory Full Regression Gate

Run the complete regression suite before touching any files:

```bash
pnpm test:regression
```

All diagnostic checks, linting, formatting, typechecking, 100% coverage gates, and Playwright E2E suites (Chromium & WebKit) must pass with exit code 0.

### Step 3: Bump Version Across All Manifests & Files

Use the deterministic version bumper:

```bash
node scripts/bump-version.mjs <VERSION>
```

This updates all 19 references across:

- `vscode-extension/package.json`
- `chrome-extension/package.json`
- `chrome-extension/manifest.json`
- `chrome-extension/manifests/manifest.chrome.json`
- `chrome-extension/manifests/manifest.safari.json`
- `obsidian-plugin/package.json`
- `obsidian-plugin/manifest.json`
- `shared/package.json`
- `starlight-plugin/package.json`
- `safari-extension/src/App/Info.plist`
- `safari-extension/src/Extension/Info.plist`
- `chrome-extension/src/telemetry/contentTelemetry.ts`
- `chrome-extension/src/telemetry/otelBackground.ts`
- `obsidian-plugin/src/telemetry.ts`
- `vscode-extension/src/telemetry/ideTelemetry.ts`
- `tests/sharedTelemetry.test.ts`
- `.github/workflows/telemetry-alert-triage.yml`
- `website/index.html`

### Step 4: Update CHANGELOG.md

Inspect recent commits since the previous release tag:

```bash
git log v<PREV_VERSION>..HEAD --oneline
```

Add a new `## [<VERSION>] - <YYYY-MM-DD>` section in `CHANGELOG.md` under `## [Unreleased]`, grouping changes into `### Added` and `### Fixed`.

### Step 5: Post-Bump Verification & CodeGraph Sync

```bash
pnpm check
pnpm format:check
pnpm codegraph:sync
```

### Step 6: Commit & Push to Main

```bash
git add -A
git commit -m "chore(release): bump version to <VERSION>"
git push origin main
```

### Step 7: Create & Push Release Branch

```bash
git checkout -b release/<VERSION>
git push -u origin release/<VERSION>
```

### Step 8: Monitor Staging Pre-Release Workflow

Monitor `.github/workflows/release-staging.yml` until completion:

```bash
gh run list --branch release/<VERSION> --limit 1
gh run watch <RUN_ID>
```

Verify that the staging release `v<VERSION>` exists and contains all 4 assets:

```bash
gh release view v<VERSION>
```

### Step 9: Promote to Production Release

Promote the staging pre-release to full production, providing title and notes so GitHub dispatches the `release: edited` event:

```bash
gh release edit v<VERSION> --prerelease=false --latest --title "Release v<VERSION>" --notes "Release v<VERSION>"
```

### Step 10: Monitor Deployments & Pages Sync

Monitor the triggered deployment workflows:

1. `.github/workflows/deploy-marketplaces.yml`:
   ```bash
   gh run list --workflow="Deploy to Marketplaces" --limit 1
   gh run watch <RUN_ID>
   ```
2. `.github/workflows/deploy-pages.yml` (dispatched automatically by the marketplaces workflow to deploy updated site):
   ```bash
   gh run list --workflow="Deploy Static Website & Astro Demo to Pages" --limit 1
   ```

### Step 11: Live Endpoint & Asset Verification

Verify HTTP 200 on direct downloads and website aliases:

```bash
# Verify direct macOS DMG
curl -ILs "https://github.com/md-comments/md-comments/releases/download/v<VERSION>/Markdown-Comments-macOS.dmg" | grep -iE "http/|location" | tail -n 1

# Verify latest alias macOS DMG
curl -ILs "https://github.com/md-comments/md-comments/releases/latest/download/Markdown-Comments-macOS.dmg" | grep -iE "http/|location" | tail -n 1

# Verify other distribution assets
for asset in chrome-extension.zip md-preview-comments-<VERSION>.vsix obsidian-plugin.zip; do
  curl -ILs "https://github.com/md-comments/md-comments/releases/download/v<VERSION>/$asset" | grep -iE "http/|location" | tail -n 1
done
```

### Step 12: Sync Local Main Branch

Return to `main` and pull any automated website commits made by the deployment workflow:

```bash
git checkout main
git pull origin main
```
