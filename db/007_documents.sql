CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('logo', 'guideline', 'asset', 'other')),
  storage_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_client ON documents (client_id);
