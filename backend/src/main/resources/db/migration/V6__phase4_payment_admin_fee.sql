-- Phase 4 refinement: payment method chosen at booking + admin fee per method

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(12, 2) NULL;

