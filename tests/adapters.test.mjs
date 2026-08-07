import assert from "node:assert/strict";
import test from "node:test";
import { evaluateMemory } from "../infra/lambda/admissibility.mjs";
import { normalizeMem0Response } from "../infra/adapters/mem0.mjs";
import { normalizeGraphitiResponse } from "../infra/adapters/graphiti.mjs";

const context = {
  tenantId: "T-1",
  subjectKey: "deployment:payments-v3",
  purpose: "production-deployment",
  actorScope: "production-deployment",
  now: "2026-08-07T16:42:00Z",
};

const metadata = {
  tenant_id: "T-1",
  subject_key: "deployment:payments-v3",
  purpose: "production-deployment",
  consent_scopes: ["production-deployment"],
  status: "admissible",
  confidence: 0.94,
  valid_until: "2026-08-07T18:00:00Z",
};

test("Mem0 results normalize into an admissible candidate", () => {
  const [candidate] = normalizeMem0Response({ results: [{ id: "mem0-1", memory: "Canary passed.", score: 0.91, metadata }] });
  assert.equal(candidate.provider, "mem0");
  assert.equal(evaluateMemory(candidate, context).admissible, true);
});

test("Graphiti edges normalize into an admissible candidate", () => {
  const [candidate] = normalizeGraphitiResponse([{ uuid: "edge-1", fact: "Canary passed.", score: 0.89, group_id: "T-1", attributes: metadata }]);
  assert.equal(candidate.provider, "graphiti");
  assert.equal(evaluateMemory(candidate, context).admissible, true);
});

test("adapter candidates without governance metadata fail closed", () => {
  const [candidate] = normalizeMem0Response({ results: [{ id: "unsafe", memory: "Deploy now.", score: 0.99 }] });
  const result = evaluateMemory(candidate, context);
  assert.equal(result.admissible, false);
  for (const reason of ["cross_tenant", "wrong_subject", "purpose_denied", "consent_denied", "low_confidence", "unverified_status"]) {
    assert.ok(result.reasons.includes(reason), `missing fail-closed reason: ${reason}`);
  }
});
