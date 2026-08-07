import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import pg from "pg";

const { Pool } = pg;
const POLICY_VERSION = "continuum-admissibility/0.1";
const EMBED_MODEL = process.env.BEDROCK_EMBED_MODEL_ID ?? "amazon.titan-embed-text-v2:0";
const demoMode = process.env.CONTINUUM_DEMO_MODE === "true";

let pool;
function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required outside demo mode");
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, ssl: { rejectUnauthorized: true } });
  }
  return pool;
}

function response(statusCode, body) {
  return { statusCode, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) };
}

function parseBody(event) {
  const value = typeof event.body === "string" ? JSON.parse(event.body) : event.body ?? event;
  for (const key of ["tenant_id", "subject_key", "query", "purpose", "request_id"]) {
    if (!value[key] || typeof value[key] !== "string") throw new Error(`Missing ${key}`);
  }
  return value;
}

async function embed(text) {
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
  return {
    request_id: input.request_id,
    subject_key: input.subject_key,
    mode: "deterministic-demo",
    decision: contradiction ? "hold_human_review" : "deploy_with_rollback_guard",
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
    const client = await db().connect();
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

      const admitted = candidates.rows.filter((row) => !row.has_conflict && row.similarity >= 0.68);
      const rejected = candidates.rows.filter((row) => row.has_conflict || row.similarity < 0.68);
      const minConfidence = admitted.length ? Math.min(...admitted.map((row) => Number(row.confidence))) : 0;
      const humanReview = rejected.some((row) => row.has_conflict) || admitted.length < 2 || minConfidence < 0.6;
      const decision = humanReview ? "hold_human_review" : "evidence_admissible";

      const receipt = await client.query(
        `INSERT INTO action_receipts
          (tenant_id, subject_key, request_id, decision, answer_confidence,
           human_review_required, admitted_memory_ids, rejected_memory_ids, policy_version, region)
         VALUES ($1::UUID,$2,$3::UUID,$4,$5,$6,$7::UUID[],$8::UUID[],$9,$10)
         ON CONFLICT (tenant_id, request_id) DO UPDATE SET request_id=excluded.request_id
         RETURNING receipt_id, created_at`,
        [input.tenant_id, input.subject_key, input.request_id, decision, minConfidence, humanReview,
          admitted.map((row) => row.memory_id), rejected.map((row) => row.memory_id), POLICY_VERSION,
          process.env.AWS_REGION ?? "unknown"],
      );
      await client.query("COMMIT");

      return response(200, {
        request_id: input.request_id,
        receipt: receipt.rows[0],
        decision,
        answer_confidence: minConfidence,
        human_review_required: humanReview,
        evidence: admitted,
        rejected: rejected.map(({ memory_id, has_conflict, similarity }) => ({ memory_id, has_conflict, similarity })),
        policy_version: POLICY_VERSION,
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
