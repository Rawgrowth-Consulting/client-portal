CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT,
  current_month INT,
  email TEXT UNIQUE NOT NULL,
  health_score INT,
  messaging_channel TEXT,
  messaging_handle TEXT,
  name TEXT NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 1,
  role TEXT DEFAULT 'client',
  slack_channel_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
