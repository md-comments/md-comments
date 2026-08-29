---
name: codegraph
description: Query, explore, and inspect code structure using CodeGraph
---

# Workflow: codegraph

Use CodeGraph to explore symbols, architecture, dependencies, and blast radius in the repository.

1. **Check index status**: `codegraph status`
2. **Explore an area or feature**: `codegraph explore "<concept or query>"`
3. **Inspect a symbol or file**: `codegraph node "<symbol or path>"`
4. **Query symbols**: `codegraph query "<search term>"`
5. **Analyze callers & callees**:
   - `codegraph callers "<symbol>"`
   - `codegraph callees "<symbol>"`
6. **Analyze blast radius / impact**:
   - `codegraph impact "<symbol>"`
   - `codegraph affected [files...]`
7. **Sync / Re-index**: `codegraph sync .` or `codegraph index .`
