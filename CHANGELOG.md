# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2026-09-02

### Added

- **Astro & Starlight Plugin (`@md-comments/starlight`)**: Official Starlight plugin and Astro integration bringing inline Markdown Comments to documentation websites without requiring browser extensions.
- **Client-Side GitHub OAuth Device Flow**: Zero-server browser authentication for documentation readers and reviewers.
- **OIDC & Trusted Publishing Release Workflow**: Automated npm publishing using OpenID Connect (OIDC) tokens with verifiable cryptographic build provenance (`--provenance`).

## [1.1.5] - 2026-08-27

### Breaking Changes

- Comment files are now stored with the 7-character git commit short SHA of the original file revision in the filename (`doc.<commit_sha>.comments.yml`).
- Legacy un-hashed comment files (`doc.comments.yml`) are read as base data for initial migration, but new comment writes will generate commit-hashed files (`doc.<commit_sha>.comments.yml`) and will no longer update legacy files. Older extension versions will not see comments stored in hashed filenames.
- Confluence-style comment aggregation: When viewing or rolling back a file to a specific commit, page comments across historical comment files remain intact and visible, while inline comments re-anchor to restored text segments.

## [1.1.3] - 2026-08-23

### Fixed

- Support text range selection commenting on single file GitHub view in Chrome extension.
- Improve author resolution in VS Code extension via GitHub OAuth token user profile and git config fallback.

## [1.1.2] - 2026-08-17

### Fixed

- Removed unused `identity` and `tabs` permissions from Chrome Extension `manifest.json` to satisfy Chrome Web Store policy requirements.

## [1.1.1] - 2026-08-09

### Changed

- Removed outdated references to GitHub Issues and local YAML companion files across documentation, UI strings, privacy policies, and manifests, standardizing exclusively on the custom git refs backend (`refs/md-comments/data`).

## [1.1.0] - 2026-08-09

### Changed

- Transitioned comment persistence to custom git refs backend (`refs/md-comments/data` orphan git ref / GitHub API) with zero-commit and zero-PR overhead.
- Updated all plugin descriptions, privacy policies, and commercial website (`md-comments.com`) documentation.

### Added

- Initial project layout and monorepo structure.
- Core shared library containing comment parser and fuzzy anchor matcher.
- VS Code / Cursor extension implementation.
- Obsidian plugin implementation.
- GitHub Chrome Extension integration.
- CI/CD release workflow configuration.
- Community health files: `AUTHORS.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`.
