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
});

test("Lambda gates recall before writing an action receipt", async () => {
  const source = await read("infra/lambda/handler.mjs");
  for (const control of ["tenant_id", "purpose", "consent_scope", "valid_until", "status='admissible'", "has_conflict", "human_review_required"]) {
    assert.ok(source.includes(control), `missing control: ${control}`);
  }
  assert.match(source, /INSERT INTO action_receipts/);
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
