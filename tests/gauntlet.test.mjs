import assert from "node:assert/strict";
import test from "node:test";
import { runGauntlet } from "../evals/run.mjs";

test("Memory Gauntlet blocks every modeled unsafe recall", async () => {
  const result = await runGauntlet();
  assert.equal(result.scenarios, 72);
  assert.equal(result.continuum.correct, 72);
  assert.equal(result.naiveVector.correct, 17);
  assert.equal(result.rows.filter((row) => row.expected === "block" && row.continuum === "block").length, 60);
  assert.equal(result.continuum.metrics.falsePositive, 0);
  assert.equal(result.continuum.metrics.falseNegative, 0);
  assert.equal(Object.keys(result.categories).length, 13);
});
