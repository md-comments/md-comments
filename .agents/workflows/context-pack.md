---
name: context-pack
description: Brief a repo using context-pack before deeper exploration
---

# Workflow: context-pack

Use this workflow to generate compact, high-signal briefings of the repository using `context-pack`.

## Common Commands

- **Onboarding / Initial Brief**:
  ```bash
  rtk context-pack brief --cwd .
  ```
- **Active Work / Changed Files Only**:
  ```bash
  rtk context-pack changed --cwd .
  ```
- **Initialize Learned Repo Memory**:
  ```bash
  rtk context-pack --cwd . --init-memory
  ```
- **Refresh Learned Repo Memory**:
  ```bash
  rtk context-pack --cwd . --refresh-memory
  ```

For more details on outputs, profiles, and MCP tools, see the custom agent skill documentation at [.agents/skills/context-pack/SKILL.md](file:///Users/maratstrelets/git/md-comments/md-comments/.agents/skills/context-pack/SKILL.md).
