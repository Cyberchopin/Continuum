-- Continuum / CockroachDB Cloud schema
-- Apply as a schema owner, then grant the Lambda role only SELECT/INSERT/UPDATE
-- on the required tables. Vector syntax follows CockroachDB stable docs.

CREATE DATABASE IF NOT EXISTS continuum;
USE continuum;

CREATE TYPE IF NOT EXISTS memory_status AS ENUM ('admissible', 'disputed', 'revoked', 'expired');
CREATE TYPE IF NOT EXISTS edge_kind AS ENUM ('supports', 'contradicts', 'supersedes', 'derived_from');

CREATE TABLE IF NOT EXISTS memories (
  tenant_id UUID NOT NULL,
  memory_id UUID NOT NULL DEFAULT gen_random_uuid(),
  subject_key STRING NOT NULL,
  content STRING NULL,
  content_hash BYTES NOT NULL,
  embedding VECTOR(1024) NULL,
  source_kind STRING NOT NULL,
  source_uri STRING NULL,
  source_actor STRING NOT NULL,
  purpose STRING NOT NULL,
  consent_scope STRING[] NOT NULL DEFAULT ARRAY[]::STRING[],
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status memory_status NOT NULL DEFAULT 'admissible',
  observed_at TIMESTAMPTZ NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NULL,
  home_region STRING NOT NULL DEFAULT 'us-east1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, memory_id),
  INDEX memories_subject_time (tenant_id, subject_key, observed_at DESC),
  INDEX memories_status_validity (tenant_id, status, valid_until),
  VECTOR INDEX memories_semantic_idx (tenant_id, embedding vector_cosine_ops)
);

CREATE TABLE IF NOT EXISTS memory_edges (
  tenant_id UUID NOT NULL,
  from_memory_id UUID NOT NULL,
  to_memory_id UUID NOT NULL,
  kind edge_kind NOT NULL,
  reason STRING NOT NULL,
  detected_by STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, from_memory_id, to_memory_id, kind),
  FOREIGN KEY (tenant_id, from_memory_id) REFERENCES memories (tenant_id, memory_id),
  FOREIGN KEY (tenant_id, to_memory_id) REFERENCES memories (tenant_id, memory_id)
);

CREATE TABLE IF NOT EXISTS tombstones (
  tenant_id UUID NOT NULL,
  memory_id UUID NOT NULL,
  content_hash BYTES NOT NULL,
  reason STRING NOT NULL,
  revoked_by STRING NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, memory_id)
);

CREATE TABLE IF NOT EXISTS action_receipts (
  tenant_id UUID NOT NULL,
  receipt_id UUID NOT NULL DEFAULT gen_random_uuid(),
  subject_key STRING NOT NULL,
  request_id UUID NOT NULL,
  decision STRING NOT NULL,
  answer_confidence DECIMAL(5,4) NOT NULL,
  human_review_required BOOL NOT NULL,
  admitted_memory_ids UUID[] NOT NULL,
  rejected_memory_ids UUID[] NOT NULL,
  policy_version STRING NOT NULL,
  region STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, receipt_id),
  UNIQUE (tenant_id, request_id)
);

-- Optional multi-region production configuration. Replace regions to match the cluster.
-- ALTER DATABASE continuum PRIMARY REGION "us-east1";
-- ALTER DATABASE continuum ADD REGION "us-west1";
-- ALTER DATABASE continuum SURVIVE REGION FAILURE;
-- ALTER TABLE memories SET LOCALITY REGIONAL BY ROW AS home_region;

-- Revocation transaction: erase recallable content while preserving auditability.
-- BEGIN;
-- INSERT INTO tombstones (...) SELECT ... FROM memories WHERE tenant_id=$1 AND memory_id=$2;
-- UPDATE memories SET content=NULL, embedding=NULL, status='revoked', updated_at=now()
--   WHERE tenant_id=$1 AND memory_id=$2;
-- COMMIT;
