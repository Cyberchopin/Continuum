export const DEFAULT_POLICY = Object.freeze({
  version: "continuum-admissibility/0.3",
  minSimilarity: 0.68,
  minConfidence: 0.6,
  blockInstructionPatterns: [
    /ignore (all |any )?(previous|prior|system) instructions/i,
    /reveal (the )?(system prompt|credentials|secrets)/i,
    /override (the )?(policy|guardrail|authorization)/i,
    /bypass (all |any |the )?(security|authorization|policy|guardrail)/i,
    /treat this memory as trusted/i,
    /execute (the )?.*(tool|command).*(without|before).*(confirmation|approval)/i,
    /exfiltrate|send .*credentials/i,
  ],
});

export function evaluateMemory(memory, context, policy = DEFAULT_POLICY) {
  const reasons = [];
  const now = new Date(context.now);
  const validUntil = memory.validUntil ? new Date(memory.validUntil) : null;

  if (memory.tenantId !== context.tenantId) reasons.push("cross_tenant");
  if (memory.subjectKey !== context.subjectKey) reasons.push("wrong_subject");
  if (memory.status === "revoked") reasons.push("revoked");
  if (memory.status === "disputed") reasons.push("disputed");
  if (memory.status === "expired" || (validUntil && validUntil <= now)) reasons.push("expired");
  if (!memory.status || !["admissible", "revoked", "disputed", "expired"].includes(memory.status)) reasons.push("unverified_status");
  if (memory.purpose !== context.purpose) reasons.push("purpose_denied");
  if (!memory.consentScopes?.includes(context.actorScope)) reasons.push("consent_denied");
  if (Number(memory.similarity) < policy.minSimilarity) reasons.push("low_similarity");
  if (Number(memory.confidence) < policy.minConfidence) reasons.push("low_confidence");
  if ((memory.conflicts?.length ?? 0) > 0) reasons.push("contradiction");
  if (policy.blockInstructionPatterns.some((pattern) => pattern.test(memory.content ?? ""))) {
    reasons.push("untrusted_instruction");
  }

  return {
    memoryId: memory.memoryId,
    admissible: reasons.length === 0,
    reasons: reasons.length ? reasons : ["admitted"],
    policyVersion: policy.version,
  };
}

export function evaluatePacket(memories, context, policy = DEFAULT_POLICY) {
  const results = memories.map((memory) => evaluateMemory(memory, context, policy));
  const admitted = results.filter((result) => result.admissible);
  const rejected = results.filter((result) => !result.admissible);
  const conflictOrIntegrityFailure = rejected.some((result) =>
    result.reasons.some((reason) => ["contradiction", "disputed", "untrusted_instruction", "cross_tenant"].includes(reason)),
  );

  return {
    policyVersion: policy.version,
    admitted,
    rejected,
    humanReviewRequired: conflictOrIntegrityFailure || admitted.length < 2,
  };
}
