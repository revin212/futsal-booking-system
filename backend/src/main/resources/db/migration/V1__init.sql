-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
  END IF;
END $$;

-- Users (internal app users; provisioned by Google login)
CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nama_lengkap TEXT NOT NULL,
  no_hp TEXT NULL,
  foto_profil TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  role user_role NOT NULL DEFAULT 'USER'
);

-- System settings
CREATE TABLE IF NOT EXISTS pengaturan_sistem (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Seed admin
INSERT INTO app_user (email, nama_lengkap, role, is_blocked)
VALUES ('admin@futsal.com', 'Admin', 'ADMIN', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Seed PengaturanSistem keys (placeholders)
INSERT INTO pengaturan_sistem (key, value) VALUES
('NamaBisnis', '-'),
('Alamat', '-'),
('NoTelepon', '-'),
('NoWhatsApp', '-'),
('JamBuka', '07:00'),
('JamTutup', '23:00'),
('NamaBank', '-'),
('NomorRekening', '-'),
('NamaRekening', '-'),
('QrisImagePath', '-'),
('CallMeBotApiKey', '-'),
('CallMeBotNoAdmin', '-'),
('TemplateWaBookingUser', 'Halo {nama}, booking {lapangan} pada {tanggal} {jamMulai}-{jamSelesai} total {total}. Status: {status}'),
('TemplateWaBookingAdmin', 'Booking masuk: {nama} booking {lapangan} pada {tanggal} {jamMulai}-{jamSelesai} total {total}.'),
('TemplateWaLunas', 'Pembayaran lunas untuk booking {lapangan} pada {tanggal} {jamMulai}-{jamSelesai}. Terima kasih, {nama}.'),
('TemplateWaReminder', 'Reminder: besok {tanggal} {jamMulai}-{jamSelesai} main di {lapangan}. Sampai jumpa, {nama}!'),
('MinJamBatalkan', '2'),
('PersenDP', '0'),
('PeakHourMulai', '18:00'),
('PeakHourSelesai', '21:00')
ON CONFLICT (key) DO NOTHING;

