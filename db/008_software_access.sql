-- Schema -----------------------------------------------------------------

CREATE TABLE software_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'admin',
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, platform)
);

CREATE INDEX idx_software_access_client ON software_access (client_id);

-- Seed (migrated from Convex) --------------------------------------------
--
-- The clientId values in the Convex export are Convex IDs, not Supabase UUIDs.
-- Before running these inserts, replace each placeholder below with the
-- matching Supabase `clients.id` (UUID).
--
--   k17dv834dbc2pnmdzf37296hdn84yjj8 → <replace with supabase client UUID>
--   k17bdwxn3z4hq983decrpn4z0d84j3fh → <replace with supabase client UUID>

INSERT INTO software_access (client_id, platform, access_type, confirmed, confirmed_at)
VALUES
  (
    '066b94d4-aaaa-447e-99c6-ccbf03ede935'::uuid,
    'google_drive',
    'admin',
    TRUE,
    to_timestamp(1776179971.678)
  )
ON CONFLICT (client_id, platform) DO UPDATE
  SET access_type = EXCLUDED.access_type,
      confirmed   = EXCLUDED.confirmed,
      confirmed_at = EXCLUDED.confirmed_at;
