-- Store the full conversational transcript (user + assistant turns) captured
-- during onboarding. Written once when `complete_onboarding` fires.

ALTER TABLE brand_intakes
  ADD COLUMN IF NOT EXISTS full_transcript JSONB;
