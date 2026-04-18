-- API integrations submitted by clients during onboarding (Section 5 / API Keys).
-- SECURITY: only a hint (last 4 chars) is stored here. The full secret is sent
-- to the team's Slack channel once, never persisted to the database.

CREATE TABLE IF NOT EXISTS api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  key_name TEXT NOT NULL,
  key_hint TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, key_name)
);

CREATE INDEX IF NOT EXISTS idx_api_integrations_client ON api_integrations (client_id);
