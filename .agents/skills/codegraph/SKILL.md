---
name: codegraph
description: >
  Surgical semantic code intelligence and knowledge graph. Use when finding symbol
  definitions, tracing callers/callees across files, analyzing blast radius and affected
  tests, or exploring codebase architecture with minimal tool calls and zero grep overhead.
---

# CodeGraph

CodeGraph is a pre-indexed semantic knowledge graph for this repository (located at `.codegraph/`). It parses the codebase into symbols (functions, classes, interfaces, methods, imports) and their relationships (calls, imports, dynamic dispatch) in a local SQLite database.

## When to Use

Reach for CodeGraph **before** running grep, glob, or reading multiple source files when:

- **Locating symbols & definitions**: "Where is `renderCard` defined and what does it do?"
- **Tracing call hierarchies**: "What functions call `saveComment`?" or "What does `parseComments` call?"
- **Understanding feature architecture**: "How does comment re-anchoring work?"
- **Refactoring & blast radius**: "If I change `CommentThread`, what breaks?"
- **Targeting affected tests**: "Which tests cover the files I just modified?"

---

## MCP Tools & CLI Commands

| Intent                           | MCP Tool (Primary)               | CLI Command (Shell)                 |
| -------------------------------- | -------------------------------- | ----------------------------------- |
| **Explore Area / Architecture**  | `codegraph_explore(query="...")` | `codegraph explore "<query>"`       |
| **Inspect Symbol / File Source** | `codegraph_node(name="...")`     | `codegraph node "<symbol or path>"` |
| **Search Symbols**               | `codegraph_query(query="...")`   | `codegraph query "<term>"`          |
| **Find Callers**                 | `codegraph_explore` / MCP        | `codegraph callers "<symbol>"`      |
| **Find Callees**                 | `codegraph_explore` / MCP        | `codegraph callees "<symbol>"`      |
| **Analyze Blast Radius**         | `codegraph_explore` / MCP        | `codegraph impact "<symbol>"`       |
| **Find Affected Tests**          | MCP / CLI                        | `codegraph affected [files...]`     |
| **Check Index Status**           | —                                | `codegraph status`                  |
| **Force Graph Sync**             | —                                | `codegraph sync .`                  |

---

## Workflows & Patterns

### 1. Surgical Symbol & Call Path Exploration

Instead of grepping across packages:

```bash
codegraph explore "how does markdown preview render comments"
```

Or inspect a specific symbol directly with line numbers and dependencies:

```bash
codegraph node "renderMarkdownWithComments"
```

### 2. Caller & Callee Inspection Across Monorepo Packages

Trace cross-file relationships without crawling directories:

```bash
# What invokes this function?
codegraph callers "renderReply"

# What does this function call?
codegraph callees "renderReply"
```

### 3. Blast Radius & Refactoring Analysis

Before modifying a core function or shared type, inspect all affected symbols:

```bash
codegraph impact "InlineComment"
```

### 4. Smart Test Selection Before Committing

Run only tests affected by changed files to speed up verification:

```bash
codegraph affected shared/src/anchor.ts vscode-extension/src/markdownRender.ts
```

### 5. Auto-Sync & Status

CodeGraph automatically synchronizes changes on file modifications. To verify status:

```bash
codegraph status
```

If manual re-indexing is ever needed:

```bash
codegraph sync .
```
