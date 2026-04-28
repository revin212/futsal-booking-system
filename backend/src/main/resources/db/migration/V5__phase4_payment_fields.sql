-- Phase 4 (Payment minimal + Upload bukti + Status booking)

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS metode_pembayaran TEXT NULL,
  ADD COLUMN IF NOT EXISTS dp_nominal NUMERIC(12, 2) NULL,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NULL,
  ADD COLUMN IF NOT EXISTS bukti_bayar_path TEXT NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);

