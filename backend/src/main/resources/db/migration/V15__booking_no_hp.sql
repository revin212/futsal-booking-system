-- Phase 6+ (Hardening/UX): store WA number on booking
ALTER TABLE booking ADD COLUMN IF NOT EXISTS no_hp TEXT;

