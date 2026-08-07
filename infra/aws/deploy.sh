#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_SECRET_ARN:-}" ]]; then
  echo "DATABASE_SECRET_ARN is required." >&2
  exit 64
fi

command -v aws >/dev/null || { echo "AWS CLI is required." >&2; exit 69; }
command -v sam >/dev/null || { echo "AWS SAM CLI is required." >&2; exit 69; }

aws sts get-caller-identity >/dev/null
sam build --template-file infra/aws/template.yaml
sam deploy \
  --stack-name continuum-memory-firewall \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "DatabaseSecretArn=${DATABASE_SECRET_ARN}" \
  --no-confirm-changeset

echo "Set CONTINUUM_LAMBDA_NAME=continuum-memory-firewall, then run npm run cloud:proof."
