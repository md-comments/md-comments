---
trigger: always_on
description: Consult the CodeGraph index at .codegraph/ for codebase and architecture questions.
---

## codegraph

This project has a CodeGraph knowledge graph at `.codegraph/`.

Rules:

- For codebase or architecture questions, when `.codegraph/` exists, use CodeGraph MCP tools (`codegraph_explore`, `codegraph_node`, `codegraph_search`, `codegraph_callers`, `codegraph_callees`, `codegraph_impact`) or CLI (`codegraph explore "<query>"`, `codegraph node "<symbol>"`, `codegraph query "<term>"`, `codegraph impact "<symbol>"`). These provide surgical code context, call hierarchies, and blast radius in one shot.
- Use `codegraph callers "<symbol>"` and `codegraph callees "<symbol>"` (or MCP equivalents) to inspect call graphs across files without crawling.
- Use `codegraph affected [files...]` to find affected test files when making changes.
- CodeGraph auto-syncs on file changes, but `codegraph sync .` can be run manually if needed.
