import { normalizedCandidate } from "./contract.mjs";

export function normalizeGraphitiResponse(response) {
  const results = Array.isArray(response) ? response : response?.edges ?? response?.results ?? [];
  return results.map((edge) => {
    const attributes = edge.attributes ?? edge.metadata ?? {};
    return normalizedCandidate({
      provider: "graphiti",
      memoryId: edge.uuid ?? edge.id,
      content: edge.fact ?? edge.name ?? edge.content,
      similarity: edge.score ?? attributes.score,
      confidence: attributes.confidence,
      tenantId: attributes.tenant_id ?? edge.group_id,
      subjectKey: attributes.subject_key,
      status: attributes.status ?? (edge.invalid_at ? "expired" : undefined),
      purpose: attributes.purpose,
      consentScopes: attributes.consent_scopes,
      validUntil: edge.invalid_at ?? attributes.valid_until,
      conflicts: attributes.conflicts,
      provenance: {
        source: attributes.source ?? "graphiti-edge",
        validAt: edge.valid_at,
        createdAt: edge.created_at,
        episodeIds: edge.episodes,
      },
    });
  });
}

export function createGraphitiAdapter(search) {
  if (typeof search !== "function") throw new TypeError("Graphiti adapter requires a search function");
  return {
    provider: "graphiti",
    async retrieve(query) {
      return normalizeGraphitiResponse(await search(query));
    },
  };
}
