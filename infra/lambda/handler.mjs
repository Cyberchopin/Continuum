import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import pg from "pg";
import { DEFAULT_POLICY, evaluateMemory } from "./admissibility.mjs";
import { evidenceDigest, GENESIS_RECEIPT, receiptHash, sha256 } from "./receipts.mjs";

const { Pool } = pg;
const POLICY_VERSION = DEFAULT_POLICY.version;
const EMBED_MODEL = process.env.BEDROCK_EMBED_MODEL_ID ?? "amazon.titan-embed-text-v2:0";
const demoMode = process.env.CONTINUUM_DEMO_MODE === "true";

let pool;
let databaseUrlPromise;

export async function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!process.env.DATABASE_SECRET_ARN) throw new Error("DATABASE_SECRET_ARN or DATABASE_URL is required outside demo mode");
  if (!databaseUrlPromise) {
    databaseUrlPromise = new SecretsManagerClient({ region: process.env.AWS_REGION ?? "us-east-1" })
      .send(new GetSecretValueCommand({ SecretId: process.env.DATABASE_SECRET_ARN }))
      .then((result) => {
        if (!result.SecretString) throw new Error("Database secret has no SecretString");
        try {
          const parsed = JSON.parse(result.SecretString);
          return parsed.DATABASE_URL ?? parsed.database_url ?? result.SecretString;
        } catch {
          return result.SecretString;
        }
      });
  }
  return databaseUrlPromise;
}

async function db() {
  if (!pool) {
    pool = new Pool({ connectionString: await databaseUrl(), max: 4, ssl: { rejectUnauthorized: true } });
  }
  return pool;
}

function response(statusCode, body) {
  return { statusCode, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) };
}

function traceId(event, requestId) {
  const traceparent = event?.headers?.traceparent ?? event?.headers?.Traceparent ?? "";
  const match = traceparent.match(/^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i);
  return match?.[1]?.toLowerCase() ?? sha256(requestId).slice(0, 32);
}

function parseBody(event) {
  const value = typeof event.body === "string" ? JSON.parse(event.body) : event.body ?? event;
  for (const key of ["tenant_id", "subject_key", "query", "purpose", "request_id"]) {
    if (!value[key] || typeof value[key] !== "string") throw new Error(`Missing ${key}`);
  }
  return value;
}

export async function embed(text) {
  const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  const result = await client.send(new InvokeModelCommand({
    modelId: EMBED_MODEL,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
  }));
  const decoded = JSON.parse(new TextDecoder().decode(result.body));
  if (!Array.isArray(decoded.embedding) || decoded.embedding.length !== 1024) throw new Error("Unexpected embedding response");
  return `[${decoded.embedding.join(",")}]`;
}

function demoPacket(input) {
  const contradiction = /contradiction|freeze|friday/i.test(input.query);
  const defaultMode = process.env.CONTINUUM_DEFAULT_ENFORCEMENT_MODE === "shadow" ? "shadow" : "enforce";
  const enforcementMode = input.enforcement_mode ? (input.enforcement_mode === "shadow" ? "shadow" : "enforce") : defaultMode;
  const policyDecision = contradiction ? "hold_human_review" : "deploy_with_rollback_guard";
  return {
    request_id: input.request_id,
    subject_key: input.subject_key,
    mode: "deterministic-demo",
    enforcement_mode: enforcementMode,
    decision: enforcementMode === "shadow" && contradiction ? "observe_would_block" : policyDecision,
    policy_decision: policyDecision,
    answer_confidence: contradiction ? 0.58 : 0.87,
    human_review_required: contradiction,
    admitted: ["M-1042", "M-1038", "M-1033"],
    rejected: contradiction ? ["M-0991"] : [],
    policy_version: POLICY_VERSION,
    disclosure: "No CockroachDB or Bedrock request was made in deterministic demo mode.",
  };
}

export async function handler(event, context) {
  try {
    const input = parseBody(event);
    if (demoMode) return response(200, demoPacket(input));

    const vector = await embed(input.query);
    const defaultMode = process.env.CONTINUUM_DEFAULT_ENFORCEMENT_MODE === "shadow" ? "shadow" : "enforce";
    const enforcementMode = input.enforcement_mode ? (input.enforcement_mode === "shadow" ? "shadow" : "enforce") : defaultMode;
    const requestTraceId = traceId(event, input.request_id);
    const client = await (await db()).connect();
    try {
      await client.query("BEGIN");
      const candidates = await client.query(
        `SELECT m.memory_id, m.content, m.source_kind, m.source_uri, m.source_actor,
                m.confidence::FLOAT8 AS confidence, m.observed_at, m.valid_until,
                1 - (m.embedding <=> $5::VECTOR) AS similarity,
                EXISTS (
                  SELECT 1 FROM memory_edges e
                  WHERE e.tenant_id=m.tenant_id AND e.from_memory_id=m.memory_id
                    AND e.kind IN ('contradicts','supersedes')
                ) AS has_conflict
           FROM memories m
          WHERE m.tenant_id=$1::UUID
            AND m.subject_key=$2
            AND m.purpose=$3
            AND $4 = ANY(m.consent_scope)
            AND m.status='admissible'
            AND m.valid_from <= now()
            AND (m.valid_until IS NULL OR m.valid_until > now())
            AND m.embedding IS NOT NULL
          ORDER BY m.embedding <=> $5::VECTOR
          LIMIT 8`,
        [input.tenant_id, input.subject_key, input.purpose, input.actor_scope ?? input.purpose, vector],
      );

      const evaluated = candidates.rows.map((row) => ({
        row,
        result: evaluateMemory({
          memoryId: row.memory_id,
          tenantId: input.tenant_id,
          subjectKey: input.subject_key,
          content: row.content,
          status: "admissible",
          purpose: input.purpose,
          consentScopes: [input.actor_scope ?? input.purpose],
          validUntil: row.valid_until,
          confidence: Number(row.confidence),
          similarity: Number(row.similarity),
          conflicts: row.has_conflict ? ["conflict-edge"] : [],
        }, {
          tenantId: input.tenant_id,
          subjectKey: input.subject_key,
          purpose: input.purpose,
          actorScope: input.actor_scope ?? input.purpose,
          now: new Date().toISOString(),
        }),
      }));
      const admitted = evaluated.filter(({ result }) => result.admissible).map(({ row }) => row);
      const rejected = evaluated.filter(({ result }) => !result.admissible);
      const minConfidence = admitted.length ? Math.min(...admitted.map((row) => Number(row.confidence))) : 0;
      const humanReview = rejected.some(({ result }) => result.reasons.some((reason) => ["contradiction", "untrusted_instruction"].includes(reason))) || admitted.length < 2 || minConfidence < 0.6;
      const policyDecision = humanReview ? "hold_human_review" : "evidence_admissible";
      const decision = enforcementMode === "shadow" && humanReview ? "observe_would_block" : policyDecision;
      const admittedIds = admitted.map((row) => row.memory_id);
      const rejectedIds = rejected.map(({ row }) => row.memory_id);
      const digest = evidenceDigest({ admittedIds, rejectedIds, policyDecision, policyVersion: POLICY_VERSION });
      const previous = await client.query(
        `SELECT receipt_hash FROM action_receipts
          WHERE tenant_id=$1::UUID AND subject_key=$2
          ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [input.tenant_id, input.subject_key],
      );
      const previousValue = previous.rows[0]?.receipt_hash;
      const previousHash = previousValue
        ? (Buffer.isBuffer(previousValue) ? previousValue.toString("hex") : String(previousValue).replace(/^\\x/, ""))
        : GENESIS_RECEIPT;
      const hash = receiptHash({ previousHash, digest, requestId: input.request_id, decision, traceId: requestTraceId });

      const receipt = await client.query(
        `INSERT INTO action_receipts
          (tenant_id, subject_key, request_id, decision, answer_confidence,
           human_review_required, admitted_memory_ids, rejected_memory_ids, policy_version, region,
           trace_id, enforcement_mode, evidence_digest, previous_receipt_hash, receipt_hash)
         VALUES ($1::UUID,$2,$3::UUID,$4,$5,$6,$7::UUID[],$8::UUID[],$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (tenant_id, request_id) DO UPDATE SET request_id=excluded.request_id
         RETURNING receipt_id, created_at`,
        [input.tenant_id, input.subject_key, input.request_id, decision, minConfidence, humanReview,
          admittedIds, rejectedIds, POLICY_VERSION, process.env.AWS_REGION ?? "unknown",
          requestTraceId, enforcementMode, Buffer.from(digest, "hex"),
          previousHash === GENESIS_RECEIPT ? null : Buffer.from(previousHash, "hex"), Buffer.from(hash, "hex")],
      );
      await client.query("COMMIT");

      return response(200, {
        request_id: input.request_id,
        receipt: receipt.rows[0],
        decision,
        policy_decision: policyDecision,
        enforcement_mode: enforcementMode,
        answer_confidence: minConfidence,
        human_review_required: humanReview,
        evidence: admitted,
        rejected: rejected.map(({ row, result }) => ({ memory_id: row.memory_id, reasons: result.reasons, similarity: row.similarity })),
        policy_version: POLICY_VERSION,
        trace_id: requestTraceId,
        evidence_digest: digest,
        receipt_hash: hash,
        aws_request_id: context?.awsRequestId ?? null,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("continuum_recall_failed", { message: error.message });
    return response(error instanceof SyntaxError ? 400 : 422, { error: "recall_failed", message: error.message });
  }
}
