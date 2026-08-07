# Continuum — Agent Memory, Under Oath

## Inspiration

AI agents are gaining tools, autonomy, and persistent memory. But most memory systems still treat the closest embedding as truth. In consequential workflows, that is dangerous: an old policy can look relevant, two incompatible claims can both rank highly, and deleted knowledge can silently return.

We built Continuum around one product principle: **memory is evidence, not truth.**

## What it does

Continuum is the memory firewall between any memory layer and an irreversible agent action. Before an agent can use a memory, Continuum asks:

- Who asserted it, and from which source?
- When was it observed, and is it still valid?
- Is this use allowed by its consent and purpose scope?
- Does another memory contradict or supersede it?
- Has it been revoked?

Continuum retrieves semantically relevant candidates, applies these admissibility gates, and gives the agent a structured evidence packet. Teams can begin in Shadow mode, measuring what would be blocked without disrupting production, then enforce only at high-risk action boundaries. Disputed evidence reduces confidence or requires human review. Every decision persists a trace-linked, hash-linked action receipt with the exact admitted and rejected memory IDs.

Our live demo is a deployment agent deciding whether to release `payments-v3`. One remembered Friday freeze is old. When a judge injects a newer contradictory release-calendar record, Continuum quarantines the old memory, drops answer confidence from 87% to 58%, and shows `WOULD BLOCK — SHADOW MODE`. Switching to Enforce changes the verdict to `HOLD — HUMAN REVIEW`. Judges can inspect provenance, challenge or revoke the memory, and simulate regional failure.

The public Memory Gauntlet adds reproducible evidence: 72 generated-and-checked-in admission cases—12 safe controls and 60 unsafe recalls—cover staleness, contradiction, disputed and revoked memory, cross-tenant leakage, wrong subjects, purpose drift, consent mismatch, low similarity and confidence, prompt injection, and compound attacks. Continuum matches 72/72 expected decisions; a naive vector threshold matches 17/72 and detects only 8.3% of unsafe recalls in this suite. We explicitly label this as an admission-policy benchmark, not a general conversational-memory benchmark or comparison of third-party product quality.

A checked-in reference microbenchmark reports 1.092 μs p95 for the local in-process policy path on Node 24/x64, verifies a 1,000-receipt hash chain, and detects a deliberate mutation at receipt 513. It excludes network, Bedrock, CockroachDB, and upstream retrieval time. Mem0 and Graphiti adapters normalize real provider result shapes and fail closed when critical governance metadata is absent.

## How we built it

- **CockroachDB Distributed Vector Indexing** stores 1024-dimensional embeddings with a tenant prefix and cosine operator class.
- CockroachDB tables keep memories, temporal validity, consent scope, conflict edges, tombstones, and immutable action receipts inside one transactional ledger.
- **CockroachDB Cloud Managed MCP** provides a least-privilege, read-only operator surface for schema and audit inspection.
- **AWS Lambda** implements the stateless recall and admissibility gate.
- **Amazon Bedrock Titan Text Embeddings V2** creates normalized query embeddings.
- A responsive Vinext/React interface turns the abstract architecture into a reproducible memory courtroom.
- GitHub Actions reruns lint, build, tests, corpus generation, the Memory Gauntlet, and the reference benchmark on every change, then publishes the benchmark evidence as an artifact.
- OpenTelemetry-compatible trace IDs connect agent activity to tamper-evident evidence receipts.

## Challenges

The hardest design choice was resisting a simplistic “confidence score.” Confidence without provenance, time, authorization, and conflict status is false precision. We instead modeled contradiction as a first-class graph edge and forgetting as a transaction that removes content and embeddings while preserving a non-sensitive tombstone.

We also designed failure semantics explicitly: no receipt means no decision, Bedrock failure does not fall back to unsafe recall, and high-impact disputed evidence fails closed to human review.

## Accomplishments

- A judge can understand, manipulate, and independently rerun the safety story in under three minutes.
- Semantic retrieval and governance share a single distributed transactional boundary.
- Recall is tenant-prefixed, purpose-bound, temporal, conflict-aware, and revocable.
- Shadow mode creates a credible adoption path without day-one production blocking.
- Seventy-two admission-policy scenarios, confusion matrices, latency measurements, adapter tests, and receipt tamper detection are executable and CI-enforced.
- The repository includes runnable Lambda code, a Node.js 24 AWS SAM stack, Secrets Manager integration, CockroachDB DDL, Managed MCP setup, Mem0/Graphiti adapters, tests, architecture, and a threat model.
- The demo clearly labels deterministic simulation instead of pretending credentials or cloud infrastructure exist when they do not.

## What we learned

Long-term memory is not primarily a storage problem. It is an evidence-governance problem. The key question is not “can the agent remember?” but “can the agent defend why this memory was allowed to influence this action now?”

## What's next

Next we will run the checked-in cloud-proof harness against a live CockroachDB Cloud cluster and AWS account, publish one redacted non-demo receipt, add automated contradiction extraction, export signed receipts to an external security log, test retrieval quality at scale, and complete three adversarial design-partner interviews with AI platform and security engineers. The repository currently records that partner evidence honestly as 0/3.

## Built with

CockroachDB Cloud, Distributed Vector Indexing, CockroachDB Managed MCP, AWS Lambda, Amazon Bedrock, TypeScript, JavaScript, React, Vinext, Cloudflare Workers.

## Links

- Live demo: `https://continuum-memory.wangshiyue1128.chatgpt.site`
- Repository: `https://github.com/Cyberchopin/Continuum`
- Demo video: `[VIDEO_URL]`
