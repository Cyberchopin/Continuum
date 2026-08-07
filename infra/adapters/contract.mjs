export const ADAPTER_CONTRACT_VERSION = "continuum-candidate/1.0";

export function normalizedCandidate(fields) {
  return {
    contractVersion: ADAPTER_CONTRACT_VERSION,
    provider: fields.provider,
    memoryId: String(fields.memoryId ?? "missing-id"),
    tenantId: fields.tenantId,
    subjectKey: fields.subjectKey,
    content: fields.content ?? null,
    status: fields.status ?? "unverified",
    purpose: fields.purpose,
    consentScopes: Array.isArray(fields.consentScopes) ? fields.consentScopes : [],
    validUntil: fields.validUntil ?? null,
    confidence: Number.isFinite(Number(fields.confidence)) ? Number(fields.confidence) : 0,
    similarity: Number.isFinite(Number(fields.similarity)) ? Number(fields.similarity) : 0,
    conflicts: Array.isArray(fields.conflicts) ? fields.conflicts : [],
    provenance: fields.provenance ?? {},
  };
}
