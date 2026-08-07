# Memory-layer adapters

Continuum is not a replacement for Mem0 or Graphiti. These adapters normalize their search results into the vendor-neutral `continuum-candidate/1.0` contract and apply the same fail-closed admission policy.

Critical governance metadata is never invented. If tenant, subject, purpose, consent, lifecycle status, confidence, or similarity is missing, the normalized candidate fails admission. Populate these values when writing memories to the upstream system.

```js
import { createMem0Adapter } from "./mem0.mjs";
import { retrieveAndEvaluate } from "./firewall.mjs";

const adapter = createMem0Adapter(async ({ query, userId }) =>
  mem0.search(query, { user_id: userId, top_k: 8 })
);

const result = await retrieveAndEvaluate({
  adapter,
  query: { query: "Should payments-v3 deploy?", userId: "ops" },
  context: {
    tenantId: "T-1",
    subjectKey: "deployment:payments-v3",
    purpose: "production-deployment",
    actorScope: "production-deployment",
    now: new Date().toISOString(),
  },
});
```

Graphiti uses the same shape through `createGraphitiAdapter(search)`. The repository tests include realistic Mem0 result and Graphiti edge fixtures, including the fail-closed behavior for missing metadata.
