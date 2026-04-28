-- Phase 6: mock payment gateway via payment_intent
CREATE TABLE IF NOT EXISTS payment_intent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'MOCK_GATEWAY',
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|SUCCEEDED|FAILED|EXPIRED
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  idempotency_key TEXT NULL,
  external_ref TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_intent_booking_id ON payment_intent (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intent_status_created_at ON payment_intent (status, created_at DESC);

