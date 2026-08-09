# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
