-- Phase 7: WA provider settings + notification delivery status fields
ALTER TABLE notification_log
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'LOGGED', -- LOGGED|SENT|FAILED|SKIPPED
  ADD COLUMN IF NOT EXISTS error_message TEXT NULL,
  ADD COLUMN IF NOT EXISTS provider_response TEXT NULL;

-- Default provider: MOCK (CallMeBot optional).
INSERT INTO pengaturan_sistem (key, value) VALUES
('WaProvider', 'MOCK')
ON CONFLICT (key) DO NOTHING;

