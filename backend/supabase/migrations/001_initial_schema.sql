-- ReturnClip Database Schema
-- Run against Supabase (Postgres) when ready to persist data
-- Until then, the backend uses in-memory storage (lib/db.ts)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Merchants: stores with return policies
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shopify_domain TEXT,
  shopify_admin_token TEXT,  -- encrypted at rest via Supabase
  policy JSONB NOT NULL,     -- full ReturnPolicy object
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Return cases: tracks each return request through its lifecycle
CREATE TABLE return_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  order_id TEXT NOT NULL,
  order_number TEXT,
  item_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'evidence', 'assessed', 'decided', 'executed', 'cancelled')),
  order_data JSONB,          -- snapshot of Order at time of return
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence assets: photos/videos attached to a return case
CREATE TABLE evidence_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES return_cases(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  type TEXT DEFAULT 'photo' CHECK (type IN ('photo', 'video')),
  metadata JSONB,            -- width, height, format, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decisions: AI assessment + refund decision for a case
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES return_cases(id) ON DELETE CASCADE,
  assessment JSONB,          -- ConditionAssessment
  refund_decision JSONB,     -- RefundDecision
  model_version TEXT,        -- e.g. "gemini-2.0-flash"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Executions: refund/exchange execution records with idempotency
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES return_cases(id) ON DELETE CASCADE,
  decision_id UUID REFERENCES decisions(id),
  selected_option_id TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,  -- prevents duplicate executions
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  provider TEXT,             -- 'shopify', 'manual', etc.
  provider_response JSONB,   -- raw response from payment provider
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'CAD',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs: immutable event log for every case transition
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES return_cases(id),
  action TEXT NOT NULL,      -- 'created', 'evidence_submitted', 'assessed', 'decided', 'executed'
  actor TEXT DEFAULT 'system',
  payload JSONB,             -- action-specific details
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_return_cases_merchant ON return_cases(merchant_id);
CREATE INDEX idx_return_cases_order ON return_cases(order_id);
CREATE INDEX idx_return_cases_status ON return_cases(status);
CREATE INDEX idx_evidence_case ON evidence_assets(case_id);
CREATE INDEX idx_decisions_case ON decisions(case_id);
CREATE INDEX idx_executions_case ON executions(case_id);
CREATE INDEX idx_executions_idempotency ON executions(idempotency_key);
CREATE INDEX idx_audit_logs_case ON audit_logs(case_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_return_cases_updated
  BEFORE UPDATE ON return_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_merchants_updated
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
