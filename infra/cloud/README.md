# Real cloud proof

The repository does not claim a live AWS/CockroachDB path until `evidence/cloud-proof.json` exists and passes validation.

1. Create a CockroachDB Cloud cluster and apply `infra/schema.sql`.
2. Store the connection string in AWS Secrets Manager as either a raw string or `{ "DATABASE_URL": "..." }`.
3. Enable Amazon Titan Text Embeddings V2 model access in the deployment region.
4. Export `DATABASE_SECRET_ARN`, authenticate the AWS CLI, and run `bash infra/aws/deploy.sh`.
5. Install the Lambda package with `cd infra/lambda && npm install`, then run `npm run seed:proof` to create three real Bedrock-embedded proof memories.
6. Return to the repository root, export `CONTINUUM_LAMBDA_NAME=continuum-memory-firewall`, and run `npm run cloud:proof`.

The capture script refuses demo-mode responses. It writes only request IDs, receipt IDs, policy outputs, trace IDs, and hashes—never memory content or credentials.

The SAM template uses Node.js 24, arm64, active tracing, least-privilege Bedrock invocation, and Secrets Manager access. The Lambda fails closed if Bedrock, the database, or receipt commit fails.
