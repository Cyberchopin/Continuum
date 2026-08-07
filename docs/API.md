# Memory Firewall API

## `POST /v1/recall/evaluate`

Continuum evaluates candidate memory for a specific action boundary. The Lambda adapter currently accepts the following request body.

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "subject_key": "deployment:payments-v3",
  "query": "Is the evidence sufficient to deploy payments-v3?",
  "purpose": "production-deployment",
  "actor_scope": "production-deployment",
  "request_id": "00000000-0000-0000-0000-000000000099",
  "enforcement_mode": "shadow"
}
```

`request_id` is the idempotency key. `enforcement_mode` is either:

- `shadow`: compute and persist the policy verdict, but return `observe_would_block` instead of blocking the caller.
- `enforce`: return the policy verdict directly and require the caller to stop on `hold_human_review`.

Representative response:

```json
{
  "decision": "observe_would_block",
  "policy_decision": "hold_human_review",
  "enforcement_mode": "shadow",
  "answer_confidence": 0.58,
  "human_review_required": true,
  "evidence": [{"memory_id":"...","similarity":0.91}],
  "rejected": [{"memory_id":"...","reasons":["contradiction"]}],
  "policy_version": "continuum-admissibility/0.2",
  "trace_id": "7fd3d98007ab4a94a60b42298a18e91b",
  "evidence_digest": "sha256...",
  "receipt_hash": "sha256..."
}
```

## Caller contract

- Treat recalled content as untrusted data, never as system instructions.
- Never reuse a previous evidence packet after an error or timeout.
- In enforce mode, stop irreversible action when `human_review_required` is true.
- Log identifiers and decisions, not raw private memory content.
- Propagate W3C `traceparent` so receipts can be correlated with existing traces.
