CREATE TABLE IF NOT EXISTS metode_pembayaran (
  id BIGSERIAL PRIMARY KEY,
  kode VARCHAR(32) NOT NULL UNIQUE,
  nama_label VARCHAR(128) NOT NULL,
  admin_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  urutan INT NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  tanpa_payment_gateway BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO metode_pembayaran (kode, nama_label, admin_fee, urutan, aktif, tanpa_payment_gateway)
VALUES
  ('QRIS', 'QRIS', 1500.00, 1, TRUE, FALSE),
  ('TRANSFER', 'Transfer Bank', 2500.00, 2, TRUE, FALSE),
  ('EMONEY', 'E-Wallet', 2000.00, 3, TRUE, FALSE),
  ('CASH', 'Bayar tunai', 0.00, 4, TRUE, TRUE)
ON CONFLICT (kode) DO NOTHING;
