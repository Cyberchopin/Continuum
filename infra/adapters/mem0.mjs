import { normalizedCandidate } from "./contract.mjs";

export function normalizeMem0Response(response) {
  const results = Array.isArray(response) ? response : response?.results ?? [];
  return results.map((item) => {
    const metadata = item.metadata ?? {};
    return normalizedCandidate({
      provider: "mem0",
      memoryId: item.id ?? item.memory_id,
      content: item.memory ?? item.content,
      similarity: item.score ?? item.similarity,
      confidence: metadata.confidence,
      tenantId: metadata.tenant_id,
      subjectKey: metadata.subject_key,
      status: metadata.status,
      purpose: metadata.purpose,
      consentScopes: metadata.consent_scopes,
      validUntil: metadata.valid_until,
      conflicts: metadata.conflicts,
      provenance: {
        source: metadata.source,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  });
}

export function createMem0Adapter(search) {
  if (typeof search !== "function") throw new TypeError("Mem0 adapter requires a search function");
  return {
    provider: "mem0",
    async retrieve(query) {
      return normalizeMem0Response(await search(query));
    },
  };
}
