# Continuum demo script — target 2:42

## 0:00–0:18 — The wound

**Visual:** Hero, orbiting memory records.

**Voice:** “Agents are learning to remember. But the closest memory is not necessarily true, current, authorized, or safe. Continuum is agent memory you can cross-examine.”

## 0:18–0:38 — Product thesis

**Visual:** Scroll through the first screen; click **Run the Memory Trial**.

**Voice:** “Every record carries provenance, time validity, confidence, consent scope, contradiction state, and a right to be forgotten. Today, a deployment agent must decide whether to release payments-v3.”

## 0:38–1:05 — Initial verdict

**Visual:** Show four evidence cards and the 87% deploy-with-rollback verdict.

**Voice:** “Three memories are current and signed. One says Friday deployments are frozen, but it came from an old human statement. A normal vector store may rank it and move on. Continuum makes the weak link visible.”

## 1:05–1:32 — Signature moment

**Visual:** Click **Inject a Contradiction**. Pause on orange disputed card and 58% hold verdict.

**Voice:** “A newer release calendar explicitly permits this canary. Continuum creates a contradiction edge, quarantines the old memory, lowers confidence, and requires human review. It never silently averages incompatible facts.”

## 1:32–1:54 — Receipts and forgetting

**Visual:** Open the memory inspector; point to provenance, validity, consent, conflicts. Click **Revoke + Tombstone**.

**Voice:** “The agent can defend exactly what influenced the action. Revocation removes recallable content and its embedding in one transaction, while a non-sensitive tombstone preserves accountability.”

## 1:54–2:16 — Real architecture

**Visual:** Show architecture section, then briefly show `schema.sql` and Lambda query in repository.

**Voice:** “CockroachDB Distributed Vector Indexing performs tenant-prefixed semantic search. The same distributed ledger stores temporal metadata, conflict edges, tombstones, and action receipts. AWS Lambda and Bedrock implement the recall gate. Managed MCP gives operators read-only audit access.”

## 2:16–2:31 — Resilience

**Visual:** Click **Simulate Region Loss** and show EU promotion.

**Voice:** “Because memory and its receipts are one consistent multi-region system, trust does not disappear with a region.”

## 2:31–2:42 — Close

**Visual:** Return to hero or the five-rule contract.

**Voice:** “Most systems ask whether an agent can remember. Continuum asks whether that memory has earned the right to act. Memory is evidence. Not truth.”

## Recording rule

Say “interactive deterministic demo” once in the architecture segment. Do not claim the region-loss button controls a live cluster until real infrastructure is connected.
