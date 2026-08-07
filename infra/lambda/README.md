# AWS Lambda memory gate

Runtime: Node.js 22.x. Handler: `handler.handler`.

The function embeds a recall query with Amazon Titan Text Embeddings V2, performs a tenant-prefixed cosine search in CockroachDB, applies purpose/consent/status/time/conflict gates, and transactionally writes an action receipt.

## Package

```bash
cd infra/lambda
npm install --omit=dev
zip -r continuum-memory-gate.zip handler.mjs admissibility.mjs node_modules package.json
```

Configure environment values from the repository `.env.example` through AWS Secrets Manager or Lambda environment variables. Grant only `bedrock:InvokeModel` for the selected model. Do not place `DATABASE_URL` in source or logs.

## Smoke request

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "subject_key": "deployment:payments-v3",
  "query": "Is the current evidence sufficient to deploy payments-v3?",
  "purpose": "production-deployment",
  "actor_scope": "production-deployment",
  "request_id": "00000000-0000-0000-0000-000000000099"
}
```

Set `CONTINUUM_DEMO_MODE=true` for a credential-free deterministic contract test. Production must set it to `false`.

Use `"enforcement_mode": "shadow"` to record what the policy would block without changing the caller's existing action path. Promote only selected high-impact routes to `"enforce"` after reviewing shadow receipts.
