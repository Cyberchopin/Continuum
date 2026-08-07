import pg from "pg";
import { databaseUrl, embed } from "./handler.mjs";
import { sha256 } from "./receipts.mjs";

const { Pool } = pg;
const tenantId = process.env.CONTINUUM_PROOF_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
const memories = [
  ["10000000-0000-0000-0000-000000000001", "Canary error rate remained below 0.2% for 42 minutes.", "deploy-bot"],
  ["10000000-0000-0000-0000-000000000002", "Rollback owner acknowledged duty through 18:00 UTC.", "pager-policy"],
  ["10000000-0000-0000-0000-000000000003", "Database CPU is 42% and pool saturation is 51%.", "signed-telemetry"],
];

const pool = new Pool({ connectionString: await databaseUrl(), max: 2, ssl: { rejectUnauthorized: true } });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const [memoryId, content, sourceActor] of memories) {
    const vector = await embed(content);
    await client.query(
      `INSERT INTO memories
        (tenant_id, memory_id, subject_key, content, content_hash, embedding, source_kind, source_actor,
         purpose, consent_scope, confidence, status, observed_at, valid_from, valid_until)
       VALUES ($1::UUID,$2::UUID,'deployment:payments-v3',$3,$4,$5::VECTOR,'proof-seed',$6,
         'production-deployment',ARRAY['production-deployment']::STRING[],0.95,'admissible',now(),now()-INTERVAL '1 hour',now()+INTERVAL '24 hours')
       ON CONFLICT (tenant_id, memory_id) DO UPDATE SET
         content=excluded.content, content_hash=excluded.content_hash, embedding=excluded.embedding,
         confidence=excluded.confidence, status='admissible', observed_at=now(), valid_until=now()+INTERVAL '24 hours', updated_at=now()`,
      [tenantId, memoryId, content, Buffer.from(sha256(content), "hex"), vector, sourceActor],
    );
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ seeded: memories.length, tenant: `${tenantId.slice(0, 8)}…`, subject: "deployment:payments-v3", contentPrinted: false }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
