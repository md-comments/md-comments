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
