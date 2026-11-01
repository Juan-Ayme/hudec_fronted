<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:graphify-rules -->
# Knowledge Graph & Codebase Architecture (Graphify)

This repository has a persistent Graphify knowledge graph generated at `graphify-out/`.

### When to use Graphify:
1. **Architecture & Code Relationships**:
   - For questions about codebase architecture, data flows, cross-file dependencies, imports, or where components/functions connect, ALWAYS consult Graphify before doing manual grep or scanning multiple files.
   - Run `graphify query "<pregunta>"` to explore relevant subgraphs and connected nodes.
   - Run `graphify path "<Origen>" "<Destino>"` to trace the connection/dependency path between two components, types, or modules.
   - Run `graphify explain "<ConceptoONodo>"` for a detailed explanation of a component/node and its immediate neighbors.

2. **Auditing & Exploration**:
   - Consult `graphify-out/GRAPH_REPORT.md` for high-level module structure, God Nodes, and communities.
   - Consult `graphify-out/graph.json` when programmatic graph data is needed.

3. **Keeping the Graph in Sync**:
   - After creating, moving, refactoring, or deleting code files in `src/`, run `graphify update .` (fast AST-only update, no LLM cost) so the knowledge graph stays synchronized with the current code.
<!-- END:graphify-rules -->

