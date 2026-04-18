CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'approved')),
  generated_at BIGINT NOT NULL,
  approved_at BIGINT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brand_profiles_client ON brand_profiles (client_id);
