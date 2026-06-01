-- 013_operations_intake.sql
--
-- OPTIONAL / FUTURE. The shipped code (src/lib/onboarding.ts → INTAKE_COLUMNS)
-- reuses the EXISTING brand_intakes JSONB columns from migration 005, so the
-- operations-first onboarding runs with NO schema change. This migration is the
-- clean-schema upgrade: run it ONLY if you also switch INTAKE_COLUMNS to these
-- semantic names. Until then, do not run it — it is not required for prod.
--
-- Operations-first onboarding (Company Operating Profile). Adds the pillars the
-- legacy brand-only intake was missing: company snapshot, function scope,
-- per-function deep-dives, tool-stack inventory, goals/bottlenecks, people,
-- guardrails, market, and access inventory.
--
-- All additive + IF NOT EXISTS so it is safe to run on the existing table.
-- Repeatable sections (functions, systems, people, access_inventory) are JSONB
-- arrays; narrative sections are JSONB objects. brand_voice already exists and
-- is reused for Pillar C.

ALTER TABLE brand_intakes
  ADD COLUMN IF NOT EXISTS company_snapshot   JSONB DEFAULT '{}',   -- Pillar A
  ADD COLUMN IF NOT EXISTS function_scope     JSONB DEFAULT '{}',   -- Pillar D (selector)
  ADD COLUMN IF NOT EXISTS functions          JSONB DEFAULT '[]',   -- Pillar D (deep-dives, array)
  ADD COLUMN IF NOT EXISTS systems            JSONB DEFAULT '[]',   -- Pillar E (tool inventory, array)
  ADD COLUMN IF NOT EXISTS goals_bottlenecks  JSONB DEFAULT '{}',   -- Pillar G
  ADD COLUMN IF NOT EXISTS people             JSONB DEFAULT '[]',   -- Pillar F (array)
  ADD COLUMN IF NOT EXISTS guardrails         JSONB DEFAULT '{}',   -- Pillar H
  ADD COLUMN IF NOT EXISTS market_customer    JSONB DEFAULT '{}',   -- Pillar B
  ADD COLUMN IF NOT EXISTS access_inventory   JSONB DEFAULT '[]';   -- Pillar J (array)
