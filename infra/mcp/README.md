# CockroachDB Cloud Managed MCP

Continuum uses the official managed endpoint at `https://cockroachlabs.cloud/mcp` as an operator inspection surface. It is deliberately **not** the mutation path used by the Lambda agent.

Recommended setup:

1. Create a CockroachDB Cloud service account scoped to the Continuum cluster.
2. Grant read-only SQL access to `memories`, `memory_edges`, `tombstones`, and `action_receipts`.
3. Configure the MCP client with OAuth `mcp:read` or a read-only service-account API key.
4. Never commit the API key; use the client credential store.
5. Ask the MCP server to inspect schema, recent receipts, contradiction counts, and regional health.

Judge verification prompts:

```text
Show the five most recent action receipts and the memory IDs admitted by each.
List disputed memories that still have no superseding edge.
Describe the indexes on continuum.public.memories.
```

The checked-in `.mcp.json` contains endpoints and scopes only, never credentials.
