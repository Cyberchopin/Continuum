# Continuum — Agent Memory, Under Oath

## Inspiration

AI agents are gaining tools, autonomy, and persistent memory. But most memory systems still treat the closest embedding as truth. In consequential workflows, that is dangerous: an old policy can look relevant, two incompatible claims can both rank highly, and deleted knowledge can silently return.

We built Continuum around one product principle: **memory is evidence, not truth.**

## What it does

Continuum is a provenance-first persistent memory control plane. Before an agent can use a memory, Continuum asks:

- Who asserted it, and from which source?
- When was it observed, and is it still valid?
- Is this use allowed by its consent and purpose scope?
- Does another memory contradict or supersede it?
- Has it been revoked?

Continuum retrieves semantically relevant candidates, applies these admissibility gates, and gives the agent a structured evidence packet. Disputed evidence reduces confidence or requires human review. Every decision persists an action receipt with the exact admitted and rejected memory IDs.

Our live demo is a deployment agent deciding whether to release `payments-v3`. One remembered Friday freeze is old. When a judge injects a newer contradictory release-calendar record, Continuum quarantines the old memory, drops answer confidence from 87% to 58%, and changes the verdict to `HOLD — HUMAN REVIEW`. Judges can inspect provenance, challenge or revoke the memory, and simulate regional failure.

## How we built it

- **CockroachDB Distributed Vector Indexing** stores 1024-dimensional embeddings with a tenant prefix and cosine operator class.
- CockroachDB tables keep memories, temporal validity, consent scope, conflict edges, tombstones, and immutable action receipts inside one transactional ledger.
- **CockroachDB Cloud Managed MCP** provides a least-privilege, read-only operator surface for schema and audit inspection.
- **AWS Lambda** implements the stateless recall and admissibility gate.
- **Amazon Bedrock Titan Text Embeddings V2** creates normalized query embeddings.
- A responsive Vinext/React interface turns the abstract architecture into a reproducible memory courtroom.

## Challenges

The hardest design choice was resisting a simplistic “confidence score.” Confidence without provenance, time, authorization, and conflict status is false precision. We instead modeled contradiction as a first-class graph edge and forgetting as a transaction that removes content and embeddings while preserving a non-sensitive tombstone.

We also designed failure semantics explicitly: no receipt means no decision, Bedrock failure does not fall back to unsafe recall, and high-impact disputed evidence fails closed to human review.

## Accomplishments

- A judge can understand and manipulate the full safety story in under three minutes.
- Semantic retrieval and governance share a single distributed transactional boundary.
- Recall is tenant-prefixed, purpose-bound, temporal, conflict-aware, and revocable.
- The repository includes runnable Lambda code, CockroachDB DDL, Managed MCP setup, tests, architecture, and a threat model.
- The demo clearly labels deterministic simulation instead of pretending credentials or cloud infrastructure exist when they do not.

## What we learned

Long-term memory is not primarily a storage problem. It is an evidence-governance problem. The key question is not “can the agent remember?” but “can the agent defend why this memory was allowed to influence this action now?”

## What's next

Next we will connect the checked-in adapter to a live CockroachDB Cloud cluster and AWS account, add automated contradiction extraction, export action receipts to an external security log, and evaluate retrieval calibration on adversarial stale-policy and memory-poisoning scenarios.

## Built with

CockroachDB Cloud, Distributed Vector Indexing, CockroachDB Managed MCP, AWS Lambda, Amazon Bedrock, TypeScript, JavaScript, React, Vinext, Cloudflare Workers.

## Links

- Live demo: `https://continuum-memory.wangshiyue1128.chatgpt.site`
- Repository: `[PUBLIC_GITHUB_URL]`
- Demo video: `[VIDEO_URL]`
