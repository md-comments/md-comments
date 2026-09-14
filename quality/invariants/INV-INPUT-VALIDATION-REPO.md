---
id: 'INV-INPUT-VALIDATION-REPO'
description: 'Repository owner and repository name parameters must be strictly validated before interpolation into GitHub API URLs to prevent path traversal.'
enforcementMechanism: 'Strict alphanumeric, hyphen, underscore regex validation in gitRefBackend with automated negative path traversal tests.'
---

# Invariant: Repository Identifier Path Traversal Defense

All methods accepting repository owner and repository name identifiers must validate them against path traversal sequences (`..`, `/`, `\`) and invalid characters before interpolating them into GitHub API URL paths. Identifiers must conform to `/^[\w.-]+$/` and reject directory navigation tokens.
