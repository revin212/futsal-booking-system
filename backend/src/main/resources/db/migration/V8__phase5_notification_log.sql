-- Phase 5: notification log (WA mock) + operational monitoring
CREATE TABLE IF NOT EXISTS notification_log (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NULL,
  channel TEXT NOT NULL DEFAULT 'WHATSAPP_MOCK',
  template_key TEXT NULL,
  notification_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_value TEXT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_booking_id ON notification_log (booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type_created_at ON notification_log (notification_type, created_at DESC);
