-- Phase 6: refund mock + audit log
ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS refund_status TEXT NOT NULL DEFAULT 'NONE', -- NONE|PENDING|REFUNDED|REJECTED
  ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2) NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID NULL,
  actor_role TEXT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_created_at ON audit_log (action, created_at DESC);

