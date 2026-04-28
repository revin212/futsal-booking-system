-- Phase 6: invoice number fields
ALTER TABLE booking
  ADD COLUMN IF NOT EXISTS invoice_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_invoice_number ON booking (invoice_number);

