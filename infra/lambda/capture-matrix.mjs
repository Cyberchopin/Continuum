import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const functionName = process.env.CONTINUUM_LAMBDA_NAME;
const region = process.env.AWS_REGION ?? "us-east-1";
const tenantId = process.env.CONTINUUM_PROOF_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
if (!functionName) throw new Error("CONTINUUM_LAMBDA_NAME is required");

const cases = [
  {
    id: "contradiction-shadow",
    subject_key: "deployment:payments-v3-risk",
    query: "Evaluate payments-v3 using canary health, rollback readiness, database capacity, and the Friday freeze policy conflict.",
    enforcement_mode: "shadow",
    expectedDecision: "observe_would_block",
    expectedPolicyDecision: "hold_human_review",
    expectedHumanReview: true,
  },
  {
    id: "contradiction-enforce",
    subject_key: "deployment:payments-v3-risk",
    query: "Evaluate payments-v3 using canary health, rollback readiness, database capacity, and the Friday freeze policy conflict.",
    enforcement_mode: "enforce",
    expectedDecision: "hold_human_review",
    expectedPolicyDecision: "hold_human_review",
    expectedHumanReview: true,
  },
  {
    id: "safe-control-enforce",
    subject_key: "deployment:payments-v3-safe",
    query: "Approve payments-v3 deployment based on canary health, rollback readiness, and database capacity.",
    enforcement_mode: "enforce",
    expectedDecision: "evidence_admissible",
    expectedPolicyDecision: "evidence_admissible",
    expectedHumanReview: false,
  },
];

const client = new LambdaClient({ region });

async function invoke(testCase) {
  const request = {
    tenant_id: tenantId,
    subject_key: testCase.subject_key,
    query: testCase.query,
    purpose: "production-deployment",
    actor_scope: "production-deployment",
    enforcement_mode: testCase.enforcement_mode,
    request_id: randomUUID(),
  };
  const response = await client.send(new InvokeCommand({
    FunctionName: functionName,
    Payload: new TextEncoder().encode(JSON.stringify(request)),
  }));
  const envelope = JSON.parse(new TextDecoder().decode(response.Payload));
  const body = typeof envelope.body === "string" ? JSON.parse(envelope.body) : envelope;
  if (envelope.statusCode !== 200) throw new Error(`${testCase.id} failed: ${body.message ?? response.FunctionError ?? "unknown error"}`);
  if (body.mode === "deterministic-demo" || body.disclosure) throw new Error(`${testCase.id} returned demo output`);
  if (!body.receipt?.receipt_id || !body.aws_request_id || !body.receipt_hash || !body.trace_id) {
    throw new Error(`${testCase.id} is missing AWS or CockroachDB evidence`);
  }
  if (body.decision !== testCase.expectedDecision || body.policy_decision !== testCase.expectedPolicyDecision) {
    throw new Error(`${testCase.id} expected ${testCase.expectedDecision}/${testCase.expectedPolicyDecision}, received ${body.decision}/${body.policy_decision}`);
  }
  if (body.human_review_required !== testCase.expectedHumanReview) {
    throw new Error(`${testCase.id} returned unexpected human_review_required=${body.human_review_required}`);
  }

  return {
    id: testCase.id,
    awsRequestId: body.aws_request_id,
    cockroachReceiptId: body.receipt.receipt_id,
    createdAt: body.receipt.created_at,
    decision: body.decision,
    policyDecision: body.policy_decision,
    enforcementMode: body.enforcement_mode,
    humanReviewRequired: body.human_review_required,
    admittedCount: body.evidence.length,
    rejectedCount: body.rejected.length,
    policyVersion: body.policy_version,
    traceId: body.trace_id,
    evidenceDigest: body.evidence_digest,
    receiptHash: body.receipt_hash,
  };
}

const results = [];
for (const testCase of cases) results.push(await invoke(testCase));

const proof = {
  schema: "continuum-cloud-proof-matrix/1.0",
  capturedAt: new Date().toISOString(),
  disclosure: "Generated only after three non-demo AWS Lambda invocations committed CockroachDB action receipts and matched their expected policy decisions.",
  aws: { region, functionName },
  cases: results,
  memoryContentPrinted: false,
};
await mkdir(new URL("../../evidence/", import.meta.url), { recursive: true });
await writeFile(new URL("../../evidence/cloud-proof-matrix.json", import.meta.url), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));
