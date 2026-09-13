---
id: 'FEAT-AUTH-DISPLAY-NAMES'
title: 'IDE GitHub Author Display Name and Avatar Resolution'
category: 'auth'
interfaces:
  - 'vscode'
  - 'cursor'
  - 'antigravity'
flowId: 'FLOW-AUTH-DISPLAY'
dependsOn:
  - 'FEAT-AUTH-IDE'
implementedIn:
  - 'vscode-extension/src/author.ts'
  - 'vscode-extension/src/githubDisplayNames.ts'
  - 'vscode-extension/media/vscode-markdown.css'
verifiedIn:
  - 'tests/vscode-author-display.test.ts'
  - 'tests/vscode-markdown-plugin.test.ts'
invariants:
  - 'INV-OAUTH-ONLY'
minCoverage: 100
---

# IDE GitHub Author Display Name and Avatar Resolution

## Overview

Resolves authenticated GitHub user display names, formatted usernames, and user avatars in desktop IDE preview panes using the GitHub API with caching and local Git config fallback.

## User Journey (Gherkin Scenarios)

- Given an author handle or login on an anchored comment card
- When the comment preview panel renders the thread
- Then the user profile is fetched from GitHub and cached
- And the display name and avatar are rendered with VS Code typography styling
- When offline or unauthenticated
- Then the author falls back gracefully to local Git user name and email
