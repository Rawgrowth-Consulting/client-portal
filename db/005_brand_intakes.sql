CREATE TABLE brand_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  basic_info JSONB DEFAULT '{}',
  social_presence JSONB DEFAULT '{}',
  origin_story JSONB DEFAULT '{}',
  business_model JSONB DEFAULT '{}',
  target_audience JSONB DEFAULT '{}',
  goals JSONB DEFAULT '{}',
  challenges JSONB DEFAULT '{}',
  brand_voice JSONB DEFAULT '{}',
  competitors JSONB DEFAULT '{}',
  content_messaging JSONB DEFAULT '{}',
  sales JSONB DEFAULT '{}',
  tools_systems JSONB DEFAULT '{}',
  additional_context JSONB DEFAULT '{}',
  call_data JSONB DEFAULT '{}',
  submitted_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_brand_intakes_client ON brand_intakes (client_id);
