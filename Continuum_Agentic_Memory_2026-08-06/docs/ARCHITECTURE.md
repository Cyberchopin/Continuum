# Architecture and failure semantics

## Recall pipeline

1. An agent sends a tenant, subject, query, purpose, actor scope, and idempotent request ID to AWS Lambda.
2. Amazon Bedrock returns a 1024-dimensional normalized embedding.
3. CockroachDB Distributed Vector Indexing retrieves candidates using an exact tenant prefix and cosine distance.
4. SQL rejects memories outside the requested subject/purpose, consent scope, status, or validity window.
5. The gate rejects or escalates memories with contradiction/supersession edges.
6. The result and exact admitted/rejected IDs are committed as an action receipt.
7. The calling agent reasons only over the evidence packet; it never receives raw unfiltered recall.

## Why one distributed database

Embeddings, metadata, conflict edges, tombstones, and receipts share a transactional boundary. A vector database plus a separate audit store could return a memory before its revocation or conflict edge becomes visible. Continuum prefers one consistent evidence ledger.

## Failure behavior

| Failure | Behavior |
|---|---|
| Bedrock unavailable | Fail closed; do not fall back to unscoped keyword recall |
| CockroachDB unavailable | Return no decision; caller must not reuse an old packet |
| Conflict detected | Quarantine the record and require review for high-impact action |
| Receipt write fails | Roll back recall transaction and return failure |
| Region unavailable | CockroachDB survival goal maintains the ledger; Lambda retries with idempotent request ID |
| Revocation requested | Null content/embedding and write a non-sensitive tombstone in one transaction |

## Product/demo boundary

The hosted product is deterministic so every judge sees the same contradiction and failure flow. The `infra/` path is the cloud implementation contract. A production badge should only be enabled after real AWS and CockroachDB resources pass the smoke test.
