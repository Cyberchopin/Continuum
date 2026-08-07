import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("CockroachDB schema contains vector retrieval and evidence controls", async () => {
  const sql = await read("infra/schema.sql");
  assert.match(sql, /VECTOR\(1024\)/);
  assert.match(sql, /VECTOR INDEX memories_semantic_idx \(tenant_id, embedding vector_cosine_ops\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS memory_edges/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS tombstones/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS action_receipts/);
  assert.match(sql, /receipt_hash BYTES NOT NULL/);
  assert.match(sql, /enforcement_mode STRING NOT NULL/);
});

test("Lambda gates recall before writing an action receipt", async () => {
  const source = await read("infra/lambda/handler.mjs");
  for (const control of ["tenant_id", "purpose", "consent_scope", "valid_until", "status='admissible'", "has_conflict", "human_review_required", "enforcement_mode", "receiptHash", "trace_id"]) {
    assert.ok(source.includes(control), `missing control: ${control}`);
  }
  assert.match(source, /INSERT INTO action_receipts/);
});

test("Lambda gives CockroachDB an explicit consent-scope parameter type", async () => {
  const source = await read("infra/lambda/handler.mjs");
  assert.match(source, /\$4::STRING = ANY\(m\.consent_scope\)/);
  assert.doesNotMatch(source, /\$4 = ANY\(m\.consent_scope\)/);
});

test("cloud proof path uses Secrets Manager and refuses demo evidence", async () => {
  const template = await read("infra/aws/template.yaml");
  const handler = await read("infra/lambda/handler.mjs");
  const capture = await read("infra/lambda/capture-proof.mjs");
  assert.match(template, /Runtime: nodejs24\.x/);
  assert.match(template, /CONTINUUM_DEMO_MODE: "false"/);
  assert.match(template, /secretsmanager:GetSecretValue/);
  assert.match(handler, /GetSecretValueCommand/);
  assert.match(capture, /Refusing to record demo-mode output as cloud proof/);
  assert.match(capture, /receipt_id/);
  assert.match(capture, /aws_request_id/);
});

test("cloud proof matrix verifies shadow, enforce, and safe-control decisions", async () => {
  const seed = await read("infra/lambda/seed-matrix.mjs");
  const capture = await read("infra/lambda/capture-matrix.mjs");
  const packageJson = JSON.parse(await read("infra/lambda/package.json"));
  assert.match(seed, /'contradicts'/);
  assert.match(seed, /contentPrinted: false/);
  for (const decision of ["observe_would_block", "hold_human_review", "evidence_admissible"]) {
    assert.ok(capture.includes(decision), `missing expected matrix decision: ${decision}`);
  }
  assert.match(capture, /returned demo output/);
  assert.match(capture, /memoryContentPrinted: false/);
  assert.equal(packageJson.scripts["seed:matrix"], "node seed-matrix.mjs");
  assert.equal(packageJson.scripts["capture:matrix"], "node capture-matrix.mjs");
});

test("repository contains no populated secret values", async () => {
  const env = await read(".env.example");
  assert.match(env, /REPLACE_ME/);
  assert.doesNotMatch(env, /AKIA[0-9A-Z]{16}/);
  assert.doesNotMatch(env, /password=[^\s]*[^_M]$/m);
});

test("judge experience discloses deterministic demo mode", async () => {
  const page = await read("app/page.tsx");
  const readme = await read("README.md");
  assert.match(page, /Interactive deterministic demo/);
  assert.match(readme, /Honest implementation boundary/);
});
