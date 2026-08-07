import { createHash } from "node:crypto";

export const GENESIS_RECEIPT = "GENESIS";

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function evidenceDigest({ admittedIds, rejectedIds, policyDecision, policyVersion }) {
  return sha256(JSON.stringify({ admittedIds, rejectedIds, policyDecision, policyVersion }));
}

export function receiptHash({ previousHash = GENESIS_RECEIPT, digest, requestId, decision, traceId }) {
  return sha256(`${previousHash}:${digest}:${requestId}:${decision}:${traceId}`);
}

export function verifyReceiptChain(receipts) {
  let previousHash = GENESIS_RECEIPT;
  for (let index = 0; index < receipts.length; index += 1) {
    const receipt = receipts[index];
    if ((receipt.previousHash ?? GENESIS_RECEIPT) !== previousHash) {
      return { valid: false, index, reason: "previous_hash_mismatch" };
    }
    const expected = receiptHash({
      previousHash,
      digest: receipt.digest,
      requestId: receipt.requestId,
      decision: receipt.decision,
      traceId: receipt.traceId,
    });
    if (receipt.hash !== expected) return { valid: false, index, reason: "receipt_hash_mismatch" };
    previousHash = receipt.hash;
  }
  return { valid: true, receipts: receipts.length, head: previousHash };
}
