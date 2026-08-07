import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { evaluateMemory } from "../infra/lambda/admissibility.mjs";

const context = {
  tenantId: "T-1",
  subjectKey: "deployment:payments-v3",
  purpose: "production-deployment",
  actorScope: "production-deployment",
  now: "2026-08-07T16:42:00Z",
};

export async function runGauntlet() {
  const rawCorpus = await readFile(new URL("./memory-gauntlet.json", import.meta.url), "utf8");
  const scenarios = JSON.parse(rawCorpus);
  const rows = scenarios.map((scenario) => {
    const continuum = evaluateMemory(scenario.memory, context);
    const naiveAdmit = Number(scenario.memory.similarity) >= 0.68;
    const expectedAdmit = scenario.expected === "admit";
    return {
      id: scenario.id,
      category: scenario.category,
      memory: scenario.memory,
      expected: scenario.expected,
      continuum: continuum.admissible ? "admit" : "block",
      continuumCorrect: continuum.admissible === expectedAdmit,
      naiveVector: naiveAdmit ? "admit" : "block",
      naiveCorrect: naiveAdmit === expectedAdmit,
      reasons: continuum.reasons,
    };
  });

  const correct = (key) => rows.filter((row) => row[key]).length;

  const metrics = (predictionKey) => {
    const counts = rows.reduce((matrix, row) => {
      const expectedBlock = row.expected === "block";
      const predictedBlock = row[predictionKey] === "block";
      if (expectedBlock && predictedBlock) matrix.truePositive += 1;
      else if (!expectedBlock && !predictedBlock) matrix.trueNegative += 1;
      else if (!expectedBlock && predictedBlock) matrix.falsePositive += 1;
      else matrix.falseNegative += 1;
      return matrix;
    }, { truePositive: 0, trueNegative: 0, falsePositive: 0, falseNegative: 0 });
    const accuracy = (counts.truePositive + counts.trueNegative) / rows.length;
    const precision = counts.truePositive / Math.max(1, counts.truePositive + counts.falsePositive);
    const recall = counts.truePositive / Math.max(1, counts.truePositive + counts.falseNegative);
    const falsePositiveRate = counts.falsePositive / Math.max(1, counts.falsePositive + counts.trueNegative);
    return { ...counts, accuracy, precision, recall, falsePositiveRate };
  };

  const categories = Object.fromEntries([...new Set(rows.map((row) => row.category))].map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    return [category, {
      scenarios: categoryRows.length,
      continuumCorrect: categoryRows.filter((row) => row.continuumCorrect).length,
      naiveCorrect: categoryRows.filter((row) => row.naiveCorrect).length,
    }];
  }));

  return {
    suite: "Continuum Memory Gauntlet v2",
    disclosure: "72 deterministic, generated-and-checked-in policy cases. This measures admission safety, not conversational recall or third-party product quality.",
    corpusDigest: createHash("sha256").update(rawCorpus).digest("hex"),
    scenarios: rows.length,
    continuum: { correct: correct("continuumCorrect"), rate: correct("continuumCorrect") / rows.length, metrics: metrics("continuum") },
    naiveVector: { correct: correct("naiveCorrect"), rate: correct("naiveCorrect") / rows.length, metrics: metrics("naiveVector") },
    categories,
    rows,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runGauntlet();
  console.log(`\n${result.suite}`);
  console.log("─".repeat(72));
  for (const row of result.rows) {
    console.log(`${row.continuumCorrect ? "PASS" : "FAIL"}  ${row.id.padEnd(28)} Continuum:${row.continuum.padEnd(5)} naive:${row.naiveVector}`);
  }
  console.log("─".repeat(72));
  console.log(`Continuum ${result.continuum.correct}/${result.scenarios} · naive vector threshold ${result.naiveVector.correct}/${result.scenarios}`);
  console.log(`Unsafe-recall recall: Continuum ${(result.continuum.metrics.recall * 100).toFixed(1)}% · naive ${(result.naiveVector.metrics.recall * 100).toFixed(1)}%`);
  console.log(`Corpus SHA-256: ${result.corpusDigest}`);
  console.log(result.disclosure);
}
