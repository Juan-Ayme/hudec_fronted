---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI). Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than raw grep output or reading multiple files.
- Read `graphify-out/GRAPH_REPORT.md` for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).

