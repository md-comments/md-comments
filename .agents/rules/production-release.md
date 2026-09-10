# Production Release Invariants & Website Sync

Whenever working on release branches, publishing GitHub releases, or bumping versions:

1. **Website Release Link Synchronization**:
   - Every production release must have its Safari companion app DMG (`Markdown-Comments-macOS.dmg`) linked from `website/index.html`.
   - The CI/CD pipeline (`.github/workflows/deploy-marketplaces.yml`) automatically updates `website/index.html` upon release publication and dispatches `deploy-pages.yml`.
   - In manual release procedures, always verify `website/index.html` points to the new release and that `deploy-pages.yml` completes successfully.

2. **Preserve Production Status**:
   - Never allow automated workflows to downgrade an already-published production release to `prerelease: true`.
   - Hotfixes and commits pushed to `release/**` branches must preserve `prerelease: false` and `latest: true` if the release was already published.

3. **Asset Availability Verification**:
   - Always verify that all release assets (`Markdown-Comments-macOS.dmg`, `chrome-extension.zip`, `.vsix`, `obsidian-plugin.zip`) return HTTP 200 via `curl -ILs`.

4. **Full Regression Gate Before Version Bump**:
   - Never bump version numbers in manifests or package files without first running and passing the full regression suite (`pnpm test:regression` or `pnpm check && pnpm test:e2e`).
   - Any failing test, type error, or coverage drop blocks version bumping immediately.

5. **Autonomous End-to-End Execution Sequence**:
   - When requested to release (e.g. "release", "release 1.3.x", "cut release", "publish release"), execute the complete release sequence end-to-end autonomously without prompting the user for intermediate steps.
   - Sequence: Run `pnpm test:regression` -> run `node scripts/bump-version.mjs <VERSION>` -> update `CHANGELOG.md` -> run `pnpm check` and `pnpm format:check` -> commit and push to `main` -> create and push `release/<VERSION>` -> monitor staging workflow run until release `v<VERSION>` is created -> promote release via `gh release edit v<VERSION> --prerelease=false --latest --title "Release v<VERSION>" --notes "Release v<VERSION>"` -> monitor `Deploy to Marketplaces` and `Deploy Pages` workflows -> verify live HTTP 200 on all assets and download URLs -> sync local `main`.
