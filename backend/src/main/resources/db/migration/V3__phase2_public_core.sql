-- Phase 2 (Core Public Pages): lapangan + foto + jam operasional + booking (read-only)

CREATE TABLE lapangan (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL,
  deskripsi TEXT NULL,
  fasilitas TEXT NOT NULL, -- JSON string (e.g. ["Parkir","Kamar mandi"])
  harga_regular NUMERIC(12, 2) NOT NULL,
  harga_peak_hour NUMERIC(12, 2) NOT NULL,
  harga_weekend NUMERIC(12, 2) NOT NULL,
  is_aktif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE foto_lapangan (
  id BIGSERIAL PRIMARY KEY,
  lapangan_id BIGINT NOT NULL REFERENCES lapangan(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  is_utama BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE jam_operasional (
  id BIGSERIAL PRIMARY KEY,
  lapangan_id BIGINT NOT NULL REFERENCES lapangan(id) ON DELETE CASCADE,
  hari_ke INT NOT NULL CHECK (hari_ke BETWEEN 0 AND 6),
  jam_buka TIME NOT NULL,
  jam_tutup TIME NOT NULL,
  is_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE booking (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  lapangan_id BIGINT NOT NULL REFERENCES lapangan(id),
  tanggal_main DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_lapangan_tanggal ON booking(lapangan_id, tanggal_main);
CREATE INDEX idx_foto_lapangan_lapangan ON foto_lapangan(lapangan_id);
CREATE INDEX idx_jam_operasional_lapangan_hari ON jam_operasional(lapangan_id, hari_ke);

-- Seed lapangan demo (A & B)
INSERT INTO lapangan (nama, tipe, deskripsi, fasilitas, harga_regular, harga_peak_hour, harga_weekend, is_aktif)
VALUES
  (
    'Lapangan A',
    'Vinyl',
    'Lapangan indoor nyaman untuk 5v5.',
    '["Parkir","Kamar mandi","Ruang ganti"]',
    150000.00,
    180000.00,
    170000.00,
    TRUE
  ),
  (
    'Lapangan B',
    'Sintetis',
    'Lapangan indoor dengan rumput sintetis premium.',
    '["Parkir","Kantin","Mushola"]',
    160000.00,
    190000.00,
    175000.00,
    TRUE
  );

-- Seed foto placeholder (min 1 per lapangan)
INSERT INTO foto_lapangan (lapangan_id, file_path, is_utama)
SELECT id, '/static/demo/lapangan-a.jpg', TRUE FROM lapangan WHERE nama = 'Lapangan A';

INSERT INTO foto_lapangan (lapangan_id, file_path, is_utama)
SELECT id, '/static/demo/lapangan-b.jpg', TRUE FROM lapangan WHERE nama = 'Lapangan B';

-- Seed jam operasional 0..6 (07:00-23:00) untuk tiap lapangan
INSERT INTO jam_operasional (lapangan_id, hari_ke, jam_buka, jam_tutup, is_aktif)
SELECT l.id, d.hari_ke, TIME '07:00', TIME '23:00', TRUE
FROM lapangan l
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(hari_ke);

