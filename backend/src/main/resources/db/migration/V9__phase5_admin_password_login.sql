-- Phase 5: admin password login (non-Google)
-- Add password_hash for manual admin accounts. Google OAuth accounts remain USER only.
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;

-- Seed/ensure admin password for the default admin account.
-- Uses pgcrypto bcrypt via crypt(..., gen_salt('bf')).
UPDATE app_user
SET password_hash = crypt('admin12345', gen_salt('bf'))
WHERE email = 'admin@futsal.com'
  AND role = 'ADMIN'
  AND (password_hash IS NULL OR password_hash = '');

