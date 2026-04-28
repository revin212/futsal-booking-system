-- Phase 6+ (Hardening): indexes for refund/payment intent ops

-- Refund filters/sorting
CREATE INDEX IF NOT EXISTS idx_booking_refund_status ON booking (refund_status);
CREATE INDEX IF NOT EXISTS idx_booking_refund_requested_at ON booking (refund_requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_refund_processed_at ON booking (refund_processed_at DESC);

-- Payment intent scheduler lookups
CREATE INDEX IF NOT EXISTS idx_payment_intent_status_booking_id ON payment_intent (status, booking_id);

