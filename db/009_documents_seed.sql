-- Documents seed (made-up values for testing) ----------------------------
--
-- This script is designed to "just run" without you having to look up UUIDs.
-- It picks the first 3 clients (ordered by created_at) and distributes the 7
-- seed documents across them, mirroring the original Convex grouping. If you
-- have fewer than 3 clients, the missing slots fall back to client #1.
--
-- The `storage_url` values are placeholders — clicking them will 404 until you
-- swap them for real Supabase Storage URLs. Edit later as needed.

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('logo', 'guideline', 'asset', 'other')),
  storage_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_client ON documents (client_id);

DO $$
DECLARE
  c1 UUID;
  c2 UUID;
  c3 UUID;
  base TEXT := 'https://example.supabase.co/storage/v1/object/public/brand-docs';
BEGIN
  SELECT id INTO c1 FROM clients ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO c2 FROM clients ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  SELECT id INTO c3 FROM clients ORDER BY created_at ASC OFFSET 2 LIMIT 1;

  IF c1 IS NULL THEN
    RAISE NOTICE 'No clients exist yet — skipping documents seed.';
    RETURN;
  END IF;

  c2 := COALESCE(c2, c1);
  c3 := COALESCE(c3, c1);

  INSERT INTO documents (client_id, type, storage_url, filename, size, created_at) VALUES
    (c1, 'logo',      base || '/seed/square_logo.png',                  'square_logo.png',                       68935,    to_timestamp(1776311736.018)),
    (c2, 'asset',     base || '/seed/All-Star_Typography_Guide.pdf',    'All-Star_Typography_Guide.pdf',         1908386,  to_timestamp(1775940170.446)),
    (c2, 'logo',      base || '/seed/All-Star_FullLogo_White.ai',       'All-Star_FullLogo_White_(Editable).ai', 234839,   to_timestamp(1775940153.144)),
    (c2, 'guideline', base || '/seed/All-Star_BrandGuidelines.pdf',     'All-Star_BrandGuidelines.pdf',          15188755, to_timestamp(1775940143.088)),
    (c2, 'logo',      base || '/seed/All-Star_FullLogo_Black.ai',       'All-Star_FullLogo_Black_(Editable).ai', 243197,   to_timestamp(1775940130.893)),
    (c3, 'logo',      base || '/seed/icon-with-bg.png',                 '0.1. Icon w: BG.png',                   36146,    to_timestamp(1775801742.495)),
    (c3, 'logo',      base || '/seed/icon-no-bg.png',                   '0. Icon No BG.png',                     41784,    to_timestamp(1775801737.151));
END $$;
