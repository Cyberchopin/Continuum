# Continuum demo script — target 2:42

## 0:00–0:18 — The wound

**Visual:** Hero, orbiting memory records.

**Voice:** “Agents are learning to remember. But the closest memory is not necessarily true, current, authorized, or safe. Continuum is agent memory you can cross-examine.”

## 0:18–0:38 — Product thesis

**Visual:** Scroll through the first screen; click **Run the Memory Trial**.

**Voice:** “Continuum is not another memory database. It is the firewall between any memory layer and an irreversible action. Today, a deployment agent must decide whether to release payments-v3.”

## 0:38–1:05 — Initial verdict

**Visual:** Show four evidence cards and the 87% deploy-with-rollback verdict.

**Voice:** “Three memories are current and signed. One says Friday deployments are frozen, but it came from an old human statement. A normal vector store may rank it and move on. Continuum makes the weak link visible.”

## 1:05–1:32 — Signature moment

**Visual:** Click **Inject a Contradiction**. Pause on orange disputed card and 58% hold verdict.

**Voice:** “A newer release calendar explicitly permits this canary. Continuum creates a contradiction edge, quarantines the old memory, and lowers confidence. In Shadow mode it records what it would block without disrupting production. Enforce mode requires human review.”

## 1:32–1:48 — Reproducible proof

**Visual:** Scroll to Memory Gauntlet; show 72/72 vs 17/72, the local p95, receipt-integrity result, and `npm run eval && npm run bench`.

**Voice:** “This is not only a UI claim. Seventy-two public admission cases include twelve safe controls and sixty unsafe recalls. Continuum catches every modeled unsafe recall without blocking a safe control; a similarity threshold catches only 8.3 percent. CI regenerates the corpus, checks its digest, and reruns the benchmark.”

## 1:48–2:04 — Receipts and forgetting

**Visual:** Open the memory inspector; point to provenance, validity, consent, conflicts. Click **Revoke + Tombstone**.

**Voice:** “The agent can defend exactly what influenced the action. Revocation removes recallable content and its embedding in one transaction, while a non-sensitive tombstone preserves accountability.”

## 2:04–2:24 — Real architecture

**Visual:** Show architecture section, then briefly show `schema.sql` and Lambda query in repository.

**Voice:** “CockroachDB Distributed Vector Indexing performs tenant-prefixed search. The same ledger stores conflict edges, tombstones, and hash-linked receipts. AWS Lambda and Bedrock implement the firewall. OpenTelemetry connects each receipt to the agent trace, and Managed MCP gives operators read-only audit access.”

## 2:24–2:36 — Resilience

**Visual:** Click **Simulate Region Loss** and show EU promotion.

**Voice:** “Because memory and its receipts are one consistent multi-region system, trust does not disappear with a region.”

## 2:36–2:48 — Close

**Visual:** Return to hero or the five-rule contract.

**Voice:** “Memory systems help agents remember. Continuum decides whether remembered evidence has earned the right to act. Memory is evidence. Not truth.”

## Recording rule

Say “interactive deterministic demo” once in the architecture segment. Do not claim the region-loss button controls a live cluster until real infrastructure is connected.
