# Continuum demo script — target 2:50

## 0:00–0:16 — The wound

**Visual:** Continuum hero and orbiting memory records.

**Voice:** “Agents are learning to remember. But the closest memory is not necessarily current, authorized, or true. When an agent can deploy code or move money, retrieval is not enough. Memory needs an admission boundary.”

## 0:16–0:32 — Product thesis

**Visual:** Click **Run the Memory Trial**.

**Voice:** “Continuum is the firewall between any memory layer and an irreversible action. It treats memory as evidence—not truth—and makes every action defensible.”

## 0:32–0:58 — Evidence before action

**Visual:** Show the four evidence cards, provenance fields, and initial deployment verdict.

**Voice:** “A deployment agent must decide whether to release payments-v3. Continuum retrieves with CockroachDB Distributed Vector Indexing, then gates each candidate by tenant, purpose, consent, validity, provenance, confidence, and conflict status.”

## 0:58–1:22 — Signature contradiction

**Visual:** Click **Inject a Contradiction**; pause on the disputed memory. Switch Shadow to Enforce.

**Voice:** “A newer release calendar contradicts an old Friday freeze. Continuum creates a contradiction edge and quarantines the weak claim. Shadow records `WOULD BLOCK` without disrupting production. Enforce changes the same evidence packet to `HOLD — HUMAN REVIEW`.”

## 1:22–1:49 — Real cloud proof

**Visual:** Open the README’s **Verified live cloud decision matrix** or `evidence/cloud-proof-matrix.json`; keep identifiers out of frame and highlight the three outcome rows.

**Voice:** “This is not only an interactive demo. Three non-demo Lambda requests used Bedrock Titan embeddings and CockroachDB Cloud, then committed hash-linked receipts. The same contradiction digest produced a Shadow observation and an Enforce hold. A separate safe control admitted three memories and rejected none. The proof runner fails if any expected decision is wrong.”

## 1:49–2:06 — Managed MCP audit

**Visual:** Show the sanitized Codex Managed MCP result: four public tables and the three recent receipt rows.

**Voice:** “CockroachDB Cloud Managed MCP then independently audited the live database through OAuth with read-only permission. It found the same three receipts without exposing memory content or credentials.”

## 2:06–2:28 — Reproducible adversarial evidence

**Visual:** Show Memory Gauntlet 72/72 versus 17/72, local latency disclosure, and receipt mutation detection.

**Voice:** “The public Memory Gauntlet adds seventy-two policy cases across twelve attack families. Continuum matches all seventy-two; a naive similarity threshold matches seventeen and detects only 8.3 percent of unsafe recalls. CI regenerates the corpus, checks its digest, and verifies a thousand-receipt hash chain.”

## 2:28–2:42 — Production architecture

**Visual:** Show the architecture diagram, briefly highlighting CockroachDB, Lambda, Bedrock, MCP, and receipts.

**Voice:** “CockroachDB keeps vectors, conflicts, tombstones, and receipts in one transactional ledger. Lambda executes the gate, Bedrock embeds the query, and trace IDs connect each action to its evidence.”

## 2:42–2:50 — Close

**Visual:** Return to the hero and five-rule contract.

**Voice:** “Memory systems help agents remember. Continuum decides whether remembered evidence has earned the right to act. Memory is evidence. Not truth.”

## Recording truth rule

Say “interactive deterministic judge experience” when transitioning to the real cloud proof. Do not imply the public UI sends live production requests. Do not describe the region-loss simulation as a real failover. The checked-in cloud matrix and sanitized MCP result are the real infrastructure evidence.
