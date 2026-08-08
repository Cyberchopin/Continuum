# Continuum — Agent Memory, Under Oath

## Inspiration

AI agents are gaining tools, autonomy, and persistent memory. Yet most memory systems optimize for retrieving what looks similar, not proving whether the retrieved claim is current, authorized, uncontradicted, and safe to act on. In consequential workflows, a stale policy, poisoned instruction, cross-tenant fact, or supposedly deleted embedding can turn a good agent into a dangerous one.

We built Continuum around one principle: **memory is evidence, not truth.**

## What it does

Continuum is a vendor-neutral memory firewall between any agent memory layer and an irreversible action. Before recalled context can influence a deployment, payment, access change, or regulated recommendation, Continuum asks:

- Who asserted this memory, and from which source?
- When was it observed, and is it still valid?
- Is this actor allowed to use it for this purpose?
- Does another memory contradict or supersede it?
- Has it been disputed, revoked, or tombstoned?
- Is the evidence strong enough to act without human review?

CockroachDB retrieves semantically relevant candidates with a tenant-prefixed distributed vector index. Continuum then applies provenance, temporal, consent, purpose, confidence, and conflict gates inside the action path. Every outcome commits a trace-linked, hash-linked action receipt containing the exact admitted and rejected memory IDs, policy version, enforcement mode, evidence digest, and previous receipt hash.

Teams can adopt Continuum safely in **Shadow** mode, recording what would have been blocked without disrupting production. They can then switch selected high-impact workflows to **Enforce**, where unsafe evidence produces a human-review hold.

The public judge experience demonstrates a deployment agent deciding whether to release `payments-v3`. A remembered Friday freeze initially looks relevant. A newer release-calendar fact contradicts it, so Continuum quarantines the old claim and changes the action boundary.

This behavior is also verified against the real cloud backend—not inferred from the UI. On August 7, 2026, three non-demo AWS Lambda invocations used Amazon Bedrock Titan Text Embeddings V2 and CockroachDB Cloud, and committed three action receipts:

| Live case | Admitted / rejected | Verified result |
|---|---:|---|
| Contradiction + Shadow | 3 / 1 | `observe_would_block` |
| Contradiction + Enforce | 3 / 1 | `hold_human_review` |
| Safe control + Enforce | 3 / 0 | `evidence_admissible` |

The two contradiction cases have the same evidence digest but different enforcement outcomes, showing that Shadow and Enforce operate on the same recalled evidence rather than separate demo fixtures. The fail-closed capture runner refuses to write proof if any result differs from its expected policy decision.

We then authenticated OpenAI Codex to **CockroachDB Cloud Managed MCP** with OAuth and read-only permission. MCP independently inspected the live `continuum.public` schema and returned the same three recent receipt outcomes without exposing IDs, hashes, memory content, credentials, or connection strings.

The credential-free **Memory Gauntlet v2** adds reproducible adversarial evidence: 72 generated-and-checked-in cases—12 safe controls and 60 unsafe recalls—cover staleness, contradiction, revoked or disputed memory, cross-tenant leakage, wrong subjects, purpose drift, consent mismatch, prompt injection, low similarity or confidence, and compound attacks. Continuum matches 72/72 expected decisions. A naive vector-similarity threshold matches 17/72 and detects only 8.3% of unsafe recalls in this suite. This is explicitly an admission-policy benchmark, not a claim about general conversational-memory quality or third-party product performance.

A checked-in Node 24/x64 reference run evaluates 72,000 candidates at 0.791 μs p50, 1.081 μs p95, and 1.883 μs p99 for the local policy path. It also verifies a 1,000-receipt hash chain and detects a deliberate mutation at receipt 513. These figures exclude network, Bedrock, CockroachDB, and upstream retrieval latency and are reproducible with the public benchmark.

## How we built it

- **CockroachDB Distributed Vector Indexing:** `VECTOR(1024)` Titan embeddings, cosine search, and an exact tenant prefix keep semantic retrieval inside the system of record.
- **CockroachDB transactional ledger:** memories, validity windows, consent scopes, contradiction edges, tombstones, and hash-linked action receipts share one consistency boundary.
- **CockroachDB Cloud Managed MCP:** an OAuth-authenticated, read-only operator path independently audits the live schema and action receipts.
- **AWS Lambda:** a stateless Node.js 24 admission endpoint executes semantic retrieval, policy evaluation, and receipt persistence.
- **Amazon Bedrock Titan Text Embeddings V2:** produces normalized 1024-dimensional embeddings for seed memories and live queries.
- **AWS Secrets Manager:** supplies the CockroachDB connection string to Lambda without committing credentials.
- **OpenTelemetry-compatible tracing:** connects each agent request to its tamper-evident receipt.
- **Mem0 and Graphiti adapters:** normalize real provider result shapes and fail closed when governance metadata is absent.
- **GitHub Actions:** reruns lint, build, tests, corpus generation, the Memory Gauntlet, benchmark assertions, and artifact validation on every change.
- **Vinext/React judge experience:** makes the contradiction, quarantine, Shadow, Enforce, receipt, and revocation lifecycle understandable in under three minutes.

## Challenges

The hardest design choice was resisting a single confidence score. Confidence without provenance, time, authorization, and conflict status is false precision. We modeled contradiction as a first-class graph edge and forgetting as a transaction that removes recallable content and its embedding while preserving a non-sensitive tombstone.

The first real Lambda proof also exposed a CockroachDB parameter-typing defect that local simulation had missed. We fixed the ambiguous consent-scope placeholder with an explicit `STRING` cast, added a regression test, redeployed the same stack, and reran the non-demo proof successfully. That failure materially improved the production path.

We also designed failure semantics explicitly: no committed receipt means no decision, Bedrock failure never falls back to unsafe recall, missing adapter metadata fails closed, and disputed high-impact evidence requires human review.

## Accomplishments

- A real AWS Lambda → Bedrock → CockroachDB path now commits auditable action receipts.
- One live proof matrix verifies Shadow, Enforce, and safe-control behavior against isolated CockroachDB subjects.
- Managed MCP independently audits the live schema and the three resulting receipts through read-only OAuth.
- Semantic retrieval and governance share a single distributed transactional boundary.
- Recall is tenant-prefixed, purpose-bound, temporal, consent-aware, conflict-aware, and revocable.
- The public suite contains 72 policy cases across 12 attack families, plus confusion matrices, latency evidence, provider adapters, and receipt-tamper detection.
- The repository includes a deployable AWS SAM stack, Secrets Manager integration, CockroachDB DDL, proof harnesses, tests, architecture, API documentation, observability guidance, and a threat model.
- The public site is clearly labeled as an interactive deterministic judge experience; real-cloud claims point to checked-in non-demo proof.

## What we learned

Long-term agent memory is not primarily a storage problem. It is an evidence-governance problem. The question is not only “can the agent remember?” It is “can the agent defend why this memory was allowed to influence this action, for this actor, purpose, and moment?”

We also learned that an adoption path matters as much as a policy engine. Shadow mode lets teams measure unsafe-memory exposure before enforcing blocks, while receipts make every calibration decision reconstructable.

## What's next

Next we will measure end-to-end retrieval latency at larger corpus sizes, automate contradiction extraction, export signed receipts to an external security log, exercise a real multi-region failover, and complete three adversarial design-partner interviews with AI platform, security, governance, and SRE practitioners. Until those interviews occur with consent, the public evidence ledger remains honestly at 0/3.

## Built with

CockroachDB Cloud, CockroachDB Distributed Vector Indexing, CockroachDB Cloud Managed MCP, AWS Lambda, Amazon Bedrock Titan Text Embeddings V2, AWS Secrets Manager, Node.js, JavaScript, TypeScript, React, Vinext, Cloudflare Workers, GitHub Actions, OpenTelemetry.

## Links

- Live demo: `https://continuum-memory.wangshiyue1128.chatgpt.site`
- Public repository: `https://github.com/Cyberchopin/Continuum`
- Verified cloud matrix: `https://github.com/Cyberchopin/Continuum/blob/main/evidence/cloud-proof-matrix.json`
- Managed MCP audit: `https://github.com/Cyberchopin/Continuum/blob/main/evidence/managed-mcp-proof.json`
- Demo video: `[VIDEO_URL]`
