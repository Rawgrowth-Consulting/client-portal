CREATE TABLE scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  month INT NOT NULL,
  week INT NOT NULL,
  calendly_url TEXT,
  scheduled_at BIGINT,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_calls_client ON scheduled_calls (client_id);
