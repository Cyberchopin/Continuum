import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const functionName = process.env.CONTINUUM_LAMBDA_NAME;
if (!functionName) throw new Error("CONTINUUM_LAMBDA_NAME is required");

const request = {
  tenant_id: process.env.CONTINUUM_PROOF_TENANT_ID ?? "00000000-0000-0000-0000-000000000001",
  subject_key: "deployment:payments-v3",
  query: "Is the current evidence sufficient to deploy payments-v3?",
  purpose: "production-deployment",
  actor_scope: "production-deployment",
  enforcement_mode: "shadow",
  request_id: randomUUID(),
};

const response = await new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-1" }).send(new InvokeCommand({
  FunctionName: functionName,
  Payload: new TextEncoder().encode(JSON.stringify(request)),
}));
const envelope = JSON.parse(new TextDecoder().decode(response.Payload));
const body = typeof envelope.body === "string" ? JSON.parse(envelope.body) : envelope;
if (envelope.statusCode !== 200) throw new Error(`Lambda proof failed: ${body.message ?? envelope.FunctionError ?? "unknown error"}`);
if (body.mode === "deterministic-demo" || body.disclosure) throw new Error("Refusing to record demo-mode output as cloud proof");
if (!body.receipt?.receipt_id || !body.aws_request_id || !body.receipt_hash || !body.trace_id) {
  throw new Error("Live response is missing AWS or CockroachDB receipt evidence");
}

const proof = {
  schema: "continuum-cloud-proof/1.0",
  capturedAt: new Date().toISOString(),
  disclosure: "Generated only after a non-demo AWS Lambda invocation committed a CockroachDB action receipt.",
  aws: { region: process.env.AWS_REGION ?? "us-east-1", requestId: body.aws_request_id, functionName },
  cockroach: { receiptId: body.receipt.receipt_id, createdAt: body.receipt.created_at },
  policy: { version: body.policy_version, decision: body.decision, enforcementMode: body.enforcement_mode },
  integrity: { traceId: body.trace_id, evidenceDigest: body.evidence_digest, receiptHash: body.receipt_hash },
};
await mkdir(new URL("../../evidence/", import.meta.url), { recursive: true });
await writeFile(new URL("../../evidence/cloud-proof.json", import.meta.url), `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));
