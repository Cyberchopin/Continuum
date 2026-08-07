import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { evaluateMemory } from "../infra/lambda/admissibility.mjs";
import { GENESIS_RECEIPT, receiptHash, verifyReceiptChain } from "../infra/lambda/receipts.mjs";
import { runGauntlet } from "./run.mjs";

const context = {
  tenantId: "T-1",
  subjectKey: "deployment:payments-v3",
  purpose: "production-deployment",
  actorScope: "production-deployment",
  now: "2026-08-07T16:42:00Z",
};

const percentile = (sorted, value) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))];

export async function runBenchmark({ rounds = 1000 } = {}) {
  const gauntlet = await runGauntlet();
  for (let warmup = 0; warmup < 100; warmup += 1) {
    for (const row of gauntlet.rows) evaluateMemory(row.memory, context);
  }

  const samples = [];
  const started = performance.now();
  for (let round = 0; round < rounds; round += 1) {
    for (const row of gauntlet.rows) {
      const before = performance.now();
      evaluateMemory(row.memory, context);
      samples.push((performance.now() - before) * 1000);
    }
  }
  const durationMs = performance.now() - started;
  samples.sort((a, b) => a - b);

  const receipts = [];
  let previousHash = GENESIS_RECEIPT;
  for (let index = 0; index < 1000; index += 1) {
    const receipt = {
      previousHash,
      digest: `${index}`.padStart(64, "0"),
      requestId: `request-${index}`,
      decision: index % 7 ? "evidence_admissible" : "hold_human_review",
      traceId: `${index}`.padStart(32, "0"),
    };
    receipt.hash = receiptHash(receipt);
    receipts.push(receipt);
    previousHash = receipt.hash;
  }
  const verifyStarted = performance.now();
  const chain = verifyReceiptChain(receipts);
  const chainVerifyMs = performance.now() - verifyStarted;
  const tampered = structuredClone(receipts);
  tampered[513].decision = "tampered";

  return {
    suite: "Continuum Memory Firewall microbenchmark v1",
    disclosure: "Local in-process policy and receipt benchmark. It excludes network, Bedrock, CockroachDB, and third-party adapter latency.",
    environment: { node: process.version, platform: process.platform, architecture: process.arch },
    gauntlet: {
      scenarios: gauntlet.scenarios,
      corpusDigest: gauntlet.corpusDigest,
      continuumAccuracy: gauntlet.continuum.metrics.accuracy,
      naiveAccuracy: gauntlet.naiveVector.metrics.accuracy,
      continuumUnsafeRecall: gauntlet.continuum.metrics.recall,
      naiveUnsafeRecall: gauntlet.naiveVector.metrics.recall,
    },
    policyLatencyMicroseconds: {
      evaluations: samples.length,
      p50: Number(percentile(samples, 0.5).toFixed(3)),
      p95: Number(percentile(samples, 0.95).toFixed(3)),
      p99: Number(percentile(samples, 0.99).toFixed(3)),
      throughputPerSecond: Math.round(samples.length / (durationMs / 1000)),
    },
    receiptIntegrity: {
      receipts: receipts.length,
      validChain: chain.valid,
      verificationMs: Number(chainVerifyMs.toFixed(3)),
      tamperDetected: !verifyReceiptChain(tampered).valid,
      tamperIndex: verifyReceiptChain(tampered).index,
    },
  };
}

const options = new Set(process.argv.slice(2));
const result = await runBenchmark({ rounds: options.has("--quick") ? 100 : 1000 });
if (options.has("--write")) {
  await mkdir(new URL("./results/", import.meta.url), { recursive: true });
  await writeFile(new URL("./results/reference.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
}
console.log(JSON.stringify(result, null, 2));
