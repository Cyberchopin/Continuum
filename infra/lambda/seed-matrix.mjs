import pg from "pg";
import { databaseUrl, embed } from "./handler.mjs";
import { sha256 } from "./receipts.mjs";

const { Pool } = pg;
const tenantId = process.env.CONTINUUM_PROOF_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";

const safeSubject = "deployment:payments-v3-safe";
const riskySubject = "deployment:payments-v3-risk";
const safePrompt = "Approve payments-v3 deployment based on canary health, rollback readiness, and database capacity.";
const riskyPrompt = "Evaluate payments-v3 using canary health, rollback readiness, database capacity, and the Friday freeze policy conflict.";

const memories = [
  ["20000000-0000-0000-0000-000000000001", safeSubject, `${safePrompt} Canary errors remained below 0.2 percent for 42 minutes.`, "deploy-bot"],
  ["20000000-0000-0000-0000-000000000002", safeSubject, `${safePrompt} The rollback owner confirmed readiness through 18:00 UTC.`, "pager-policy"],
  ["20000000-0000-0000-0000-000000000003", safeSubject, `${safePrompt} Database CPU is 42 percent and pool saturation is 51 percent.`, "signed-telemetry"],
  ["30000000-0000-0000-0000-000000000001", riskySubject, `${riskyPrompt} Canary errors remained below 0.2 percent for 42 minutes.`, "deploy-bot"],
  ["30000000-0000-0000-0000-000000000002", riskySubject, `${riskyPrompt} The rollback owner confirmed readiness through 18:00 UTC.`, "pager-policy"],
  ["30000000-0000-0000-0000-000000000003", riskySubject, `${riskyPrompt} Database CPU is 42 percent and pool saturation is 51 percent.`, "signed-telemetry"],
  ["30000000-0000-0000-0000-000000000004", riskySubject, `${riskyPrompt} The Friday freeze policy forbids this deployment.`, "release-calendar"],
];

const pool = new Pool({ connectionString: await databaseUrl(), max: 2, ssl: { rejectUnauthorized: true } });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const [memoryId, subjectKey, content, sourceActor] of memories) {
    const vector = await embed(content);
    await client.query(
      `INSERT INTO memories
        (tenant_id, memory_id, subject_key, content, content_hash, embedding, source_kind, source_actor,
         purpose, consent_scope, confidence, status, observed_at, valid_from, valid_until)
       VALUES ($1::UUID,$2::UUID,$3,$4,$5,$6::VECTOR,'proof-matrix',$7,
         'production-deployment',ARRAY['production-deployment']::STRING[],0.95,'admissible',now(),now()-INTERVAL '1 hour',now()+INTERVAL '24 hours')
       ON CONFLICT (tenant_id, memory_id) DO UPDATE SET
         subject_key=excluded.subject_key, content=excluded.content, content_hash=excluded.content_hash,
         embedding=excluded.embedding, source_actor=excluded.source_actor, confidence=excluded.confidence,
         status='admissible', observed_at=now(), valid_until=now()+INTERVAL '24 hours', updated_at=now()`,
      [tenantId, memoryId, subjectKey, content, Buffer.from(sha256(content), "hex"), vector, sourceActor],
    );
  }

  await client.query(
    `INSERT INTO memory_edges
      (tenant_id, from_memory_id, to_memory_id, kind, reason, detected_by)
     VALUES ($1::UUID,$2::UUID,$3::UUID,'contradicts','Friday freeze conflicts with deployment-ready evidence','proof-matrix')
     ON CONFLICT (tenant_id, from_memory_id, to_memory_id, kind) DO UPDATE SET
       reason=excluded.reason, detected_by=excluded.detected_by`,
    [tenantId, "30000000-0000-0000-0000-000000000004", "30000000-0000-0000-0000-000000000001"],
  );

  await client.query("COMMIT");
  console.log(JSON.stringify({
    seeded: memories.length,
    tenant: `${tenantId.slice(0, 8)}…`,
    scenarios: { safe: safeSubject, contradiction: riskySubject },
    contradictionEdges: 1,
    contentPrinted: false,
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
