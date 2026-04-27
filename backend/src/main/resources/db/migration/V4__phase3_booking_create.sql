-- Phase 3 (Booking Create): add total price field (future-proof)

ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS total_harga NUMERIC(12, 2) NULL;

