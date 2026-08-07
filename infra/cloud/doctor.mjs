import { spawnSync } from "node:child_process";

const commands = ["aws", "sam"];
const checks = commands.map((command) => ({
  check: command,
  ready: spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0,
}));
checks.push(
  { check: "DATABASE_SECRET_ARN", ready: Boolean(process.env.DATABASE_SECRET_ARN) },
  { check: "CONTINUUM_LAMBDA_NAME", ready: Boolean(process.env.CONTINUUM_LAMBDA_NAME) },
  { check: "AWS identity", ready: spawnSync("aws", ["sts", "get-caller-identity"], { stdio: "ignore" }).status === 0 },
);

const ready = checks.every((check) => check.ready);
console.log(JSON.stringify({ ready, checks, note: "No credential values are printed." }, null, 2));
if (!ready) process.exitCode = 2;
