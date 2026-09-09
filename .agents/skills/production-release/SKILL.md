---
name: production-release
description: >
  Standard procedure for publishing production releases, ensuring website download links are updated, preserving release status invariants, and deploying GitHub Pages.
  Triggers on "release", "production release", "publish release", "update website on release", or when bumping/releasing new versions.
---

# Production Release Procedure

When cutting, promoting, or publishing a production release for `md-comments`, follow this standard procedure to ensure all client interfaces, documentation, and the static website point to the correct release assets and download URLs.

## Release Invariants

1. **Explicit Production Status**:
   Production releases MUST be published with `--prerelease=false --latest`. Never leave a published production release marked as a pre-release.

   ```bash
   gh release edit v<VERSION> --prerelease=false --latest
   ```

2. **No Pre-release Downgrades**:
   Pushing fixes or maintenance commits to `release/**` branches must never downgrade an already-published production release back to `prerelease: true`. The workflow `.github/workflows/release-staging.yml` checks existing release state to preserve production status.

3. **Synchronize Website Download Links**:
   Every production release introduces new binaries/DMGs. The website (`website/index.html`) must be updated to reference the new release:
   - Target URL: `https://github.com/md-comments/md-comments/releases/download/v<VERSION>/Markdown-Comments-macOS.dmg`
   - `.github/workflows/deploy-marketplaces.yml` automatically updates `website/index.html` and triggers `.github/workflows/deploy-pages.yml` upon release publication.
   - `website/main.js` dynamically verifies the latest release asset at runtime as a fallback.

4. **Asset Completeness Verification**:
   Before announcing or verifying a release, verify that all 4 distribution assets are attached and return HTTP 200:
   - `Markdown-Comments-macOS.dmg` (macOS Safari companion app)
   - `chrome-extension.zip` (Chrome Web Store)
   - `md-preview-comments-<VERSION>.vsix` (VS Code & Open VSX)
   - `obsidian-plugin.zip` (Obsidian)

---

## Step-by-Step Production Release Workflow

### Step 1: Pre-Bump Full Regression & Version Bumping

Before bumping any version numbers or cutting a release branch, run the mandatory full regression suite:

```bash
pnpm test:regression
# Or run individually:
# pnpm check && pnpm test:e2e
```

Do NOT proceed with version bumping if any check fails or errors out.

Once regression passes with 0 errors, update all versions across manifests and packages:

- `package.json`
- `vscode-extension/package.json`
- `chrome-extension/manifests/chrome/manifest.json`
- `chrome-extension/manifests/safari/manifest.json`
- `obsidian-plugin/manifest.json`
- `shared/package.json`
- `starlight-plugin/package.json`
- `demo-astro/package.json`
- Telemetry `serviceVersion` strings across packages

Run final validation:

```bash
pnpm check
```

### Step 2: Staging & Release Branch

1. Create and push the release branch `release/<VERSION>`:
   ```bash
   git checkout -b release/<VERSION>
   git push origin release/<VERSION>
   ```
2. Monitor `.github/workflows/release-staging.yml`:
   - Builds Linux packaging artifacts.
   - Runs `macos-15` runner to build and package `Markdown-Comments-macOS.dmg`.
   - Creates staging pre-release `v<VERSION>`.

### Step 3: Promote to Production Release

Promote the pre-release to full production:

```bash
gh release edit v<VERSION> --prerelease=false --latest
```

### Step 4: Verify Automated Deployments & Website Sync

Promoting triggers `.github/workflows/deploy-marketplaces.yml`:

- Publishes to Chrome Web Store, VS Code Marketplace, Open VSX, npm, and Obsidian.
- Runs `update-website` job:
  - Updates `website/index.html` with direct download link for `v<VERSION>`.
  - Commits and pushes update to `main`.
  - Dispatches `.github/workflows/deploy-pages.yml` to publish the updated site to GitHub Pages.

### Step 5: Live Verification

Run verification commands to confirm HTTP 200 on all download endpoints:

```bash
# Verify direct release asset
curl -ILs "https://github.com/md-comments/md-comments/releases/download/v<VERSION>/Markdown-Comments-macOS.dmg" | grep -iE "http/|location"

# Verify website "latest" alias
curl -ILs "https://github.com/md-comments/md-comments/releases/latest/download/Markdown-Comments-macOS.dmg" | grep -iE "http/|location"
```
