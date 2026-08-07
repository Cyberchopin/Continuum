import { evaluatePacket } from "../lambda/admissibility.mjs";

export async function retrieveAndEvaluate({ adapter, query, context, policy }) {
  const started = performance.now();
  const candidates = await adapter.retrieve(query);
  const retrievedAt = performance.now();
  const packet = evaluatePacket(candidates, context, policy);
  const completedAt = performance.now();
  return {
    adapter: adapter.provider,
    candidates,
    packet,
    latency: {
      retrievalMs: Number((retrievedAt - started).toFixed(3)),
      policyMs: Number((completedAt - retrievedAt).toFixed(3)),
      totalMs: Number((completedAt - started).toFixed(3)),
    },
  };
}
