import { readFile } from "node:fs/promises";

const evidence = JSON.parse(await readFile(new URL("./design-partner-evidence.json", import.meta.url), "utf8"));
const required = ["participantRole", "interviewedAt", "workflow", "sharpestObjection", "productDecision", "anonymousQuoteApproved"];
const invalid = evidence.interviews.filter((entry) => required.some((field) => entry[field] === undefined || entry[field] === ""));
const approved = evidence.interviews.filter((entry) => entry.anonymousQuoteApproved === true && !invalid.includes(entry));
const result = { target: evidence.target, recorded: evidence.interviews.length, approved: approved.length, invalid: invalid.length, targetMet: approved.length >= evidence.target };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes("--require-target") && !result.targetMet) process.exitCode = 2;
