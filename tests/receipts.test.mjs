import assert from "node:assert/strict";
import test from "node:test";
import { GENESIS_RECEIPT, receiptHash, verifyReceiptChain } from "../infra/lambda/receipts.mjs";

function chain(length) {
  const receipts = [];
  let previousHash = GENESIS_RECEIPT;
  for (let index = 0; index < length; index += 1) {
    const receipt = {
      previousHash,
      digest: `${index}`.padStart(64, "0"),
      requestId: `request-${index}`,
      decision: "evidence_admissible",
      traceId: `${index}`.padStart(32, "0"),
    };
    receipt.hash = receiptHash(receipt);
    receipts.push(receipt);
    previousHash = receipt.hash;
  }
  return receipts;
}

test("receipt verifier accepts an intact hash-linked chain", () => {
  assert.equal(verifyReceiptChain(chain(100)).valid, true);
});

test("receipt verifier pinpoints a mutated decision", () => {
  const receipts = chain(100);
  receipts[41].decision = "tampered";
  assert.deepEqual(verifyReceiptChain(receipts), { valid: false, index: 41, reason: "receipt_hash_mismatch" });
});
