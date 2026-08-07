# Threat model

Continuum protects memory integrity and recall authorization; it does not guarantee that an upstream human or sensor is correct.

| Threat | Example | Control | Residual risk |
|---|---|---|---|
| Memory poisoning | A malicious chat message asserts a fake policy | Provenance, source class, confidence, conflict edges, review threshold | A trusted source can still be compromised |
| Cross-tenant retrieval | Similar embedding leaks another customer | Tenant is a vector-index prefix and mandatory SQL predicate | Application must validate tenant identity before Lambda |
| Adapter metadata omission | Upstream memory omits tenant, purpose, consent, or lifecycle state | Mem0/Graphiti contracts normalize missing fields to fail-closed values | Upstream writers must persist governance metadata |
| Stale truth | Old freeze policy outranks current calendar | `valid_until`, observed time, supersession edges | Unknown expiry requires conservative policy |
| Consent drift | Personal fact reused for deployment purpose | Purpose + consent scope enforced in SQL | Badly designed scopes can be overly broad |
| Silent resurrection | Deleted content remains in vectors/cache | Transactional content/embedding null + tombstone | External model logs need separate retention controls |
| Fabricated evidence | Demo output is presented as a real cloud run | Cloud capture rejects deterministic mode and requires AWS request + Cockroach receipt IDs | Repository owner must publish the generated proof file and recording |
| Contradiction averaging | Two incompatible claims produce confident output | Conflict is a first-class edge; high-impact action escalates | Conflict detection itself can miss semantic nuance |
| Prompt injection | Recalled text instructs the agent to ignore policy | Evidence is data, never system instruction; schema-delimited packet | Downstream model still needs instruction hierarchy |
| MCP overreach | Operator agent mutates production memory | Managed MCP configured read-only; writes use separate app role | Cloud role misconfiguration remains possible |
| Audit tampering | Agent hides evidence after action | Append-only receipts and least-privilege role | DBA-level actors require external log export |
| Unsafe rollout | A new policy blocks valid production actions | Shadow mode, reviewed overrides, selective route enforcement | Calibration still requires representative traffic |

## Non-goals

- Diagnosing people or inferring protected traits.
- Automatically resolving every contradiction.
- Claiming deterministic truth from probabilistic evidence.
- Replacing human authorization for irreversible, high-impact actions.
