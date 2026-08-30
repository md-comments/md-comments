---
name: plan-authoring
description: Guidelines and standards for creating and updating plan files and architecture proposals in .plans/. Ensures plan structure, clear milestone definitions, and mandatory Markdown Comments header badge.
metadata:
  short-description: Standards for authoring plans in .plans/
---

# Plan Authoring Standards

Use this skill when drafting, creating, or updating implementation plans, RFCs, architecture proposals, or roadmaps under `.plans/`.

## Mandatory Markdown Comments Badge

Every plan file under `.plans/*.md` **MUST** include the Markdown Comments badge immediately below the `# H1 Title` at the top of the file:

```markdown
[![Markdown Comments](https://img.shields.io/badge/markdown--comments-active-6366f1?style=flat-square&logo=github&logoColor=white)](https://chromewebstore.google.com/detail/markdown-comments/mjlhdjonjfcedkbpajkfeidfebefhkpp)
```

### Purpose

When plans are reviewed directly on GitHub, reviewers without the Markdown Comments extension need a visual callout indicating that comments and discussion threads are active, along with a direct link to install the extension.

## Plan File Structure Guidelines

1. **Title (H1)**: Clear, descriptive document title.
2. **Badge**: Single Markdown Comments badge directly below the title.
3. **Overview & Objectives**: Problem definition, goals, and non-goals.
4. **Current State vs. Proposed Architecture**: Technical trade-offs, schemas, or data flow.
5. **Milestones & Action Items**: Phased implementation steps with verification criteria.
