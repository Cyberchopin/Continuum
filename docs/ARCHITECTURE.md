# Architecture and failure semantics

## Recall pipeline

1. An agent or a Mem0/Graphiti adapter sends a tenant, subject, query, purpose, actor scope, and idempotent request ID to AWS Lambda.
2. Amazon Bedrock returns a 1024-dimensional normalized embedding.
3. CockroachDB Distributed Vector Indexing retrieves candidates using an exact tenant prefix and cosine distance.
4. SQL rejects memories outside the requested subject/purpose, consent scope, status, or validity window.
5. The gate rejects or escalates memories with contradiction/supersession edges.
6. Shadow mode records the policy verdict without changing the caller's existing action path; Enforce mode returns the verdict directly.
7. The result, trace ID, evidence digest, prior receipt hash, and exact admitted/rejected IDs are committed as a tamper-evident action receipt.
8. The calling agent reasons only over the evidence packet; it never receives raw unfiltered recall.

## Why one distributed database

Embeddings, metadata, conflict edges, tombstones, and receipts share a transactional boundary. A vector database plus a separate audit store could return a memory before its revocation or conflict edge becomes visible. Continuum prefers one consistent evidence ledger.

## Evidence states

- **Repository proof:** the corpus digest, confusion matrix, local policy latency, adapter fixtures, and receipt-integrity checks run without credentials.
- **Cloud proof:** the SAM stack runs Node.js 24 on AWS Lambda, calls Bedrock, retrieves from CockroachDB, and commits a receipt. The capture script refuses demo output.
- **Design-partner proof:** real practitioner objections and product decisions live in the research ledger; the repository starts at 0/3 rather than fabricating validation.

## Failure behavior

| Failure | Behavior |
|---|---|
| Bedrock unavailable | Fail closed; do not fall back to unscoped keyword recall |
| CockroachDB unavailable | Return no decision; caller must not reuse an old packet |
| Conflict detected | Quarantine the record and require review for high-impact action |
| Receipt write fails | Roll back recall transaction and return failure; no receipt means no decision |
| Region unavailable | CockroachDB survival goal maintains the ledger; Lambda retries with idempotent request ID |
| Revocation requested | Null content/embedding and write a non-sensitive tombstone in one transaction |

## Product/demo boundary

The hosted product is deterministic so every judge sees the same contradiction and failure flow. The `infra/` path is the cloud implementation contract. A production badge should only be enabled after real AWS and CockroachDB resources pass the smoke test.
