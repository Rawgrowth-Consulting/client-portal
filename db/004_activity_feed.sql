CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  agent_name TEXT,
  metadata JSONB,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
  read_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_feed_client ON activity_feed (client_id);
