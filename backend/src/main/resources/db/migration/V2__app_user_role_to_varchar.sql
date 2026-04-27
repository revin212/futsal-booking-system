-- Convert app_user.role from Postgres enum (user_role) to TEXT so Hibernate EnumType.STRING works.
-- Important: drop default first to remove dependency on the enum type.
ALTER TABLE app_user
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE app_user
  ALTER COLUMN role TYPE TEXT
  USING role::text;

ALTER TABLE app_user
  ALTER COLUMN role SET DEFAULT 'USER';

