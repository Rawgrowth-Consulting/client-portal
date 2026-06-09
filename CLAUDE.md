# client-portal — CLAUDE.md

Rawgrowth client-facing onboarding portal (portal.rawgrowth.ai). Next.js 16 App Router + Supabase + OpenAI tool-calling chat. Owners: Pedro (CTO), Dilan (eng).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- NextAuth Credentials provider, magic-link id (no email actually sent — `authorize()` just checks if email exists in `clients` table)
- Supabase Postgres `usjrbzzpnpbveyelyfuv` (Portal tenant — separate from per-client Supabase projects spun up later)
- OpenAI SDK with tool-calling for the onboarding bot
- Vercel deploy (project `prj_d9YzYm8YDkm6Z5NHwvP7EOETNpdr` in team `chriswestts-projects`)

## Critical files

- `src/lib/onboarding.ts` — `SECTIONS[]` (16 ordered sections), `INTAKE_COLUMNS` (maps section ids to `brand_intakes` jsonb columns — reused legacy column names, do NOT rename), `BUSINESS_FUNCTIONS` (canonical slugs: operations, sales, delivery, success, marketing, finance, people, product, leadership), `TOOL_CATEGORIES`, `PERSON_FIELDS`, `SCHEDULE_CALLS`, helpers.
- `src/app/api/onboarding/chat/route.ts` — the bot. `SYSTEM_PROMPT`, `TOOLS[]` schemas, `saveNarrativeSection`, `addRepeatableRow` (with `normalizeFunctionId`), `completeRepeatableSection`, `generateAutomationMap` (with empty-section guard), `approveAutomationMap`, streaming loop with adaptive `tool_choice`.
- `src/app/onboarding/OnboardingChat.tsx` — client UI. Includes `PortalButton` which auto-redirects to /dashboard 2.5s after completion.
- `src/lib/auth-config.ts` — NextAuth setup. `authorize()` lookups by email only.
- `src/lib/auth.ts` — `getAuthUser`, `getAuthenticatedClient`, `requireAuth`, `requireAdmin`, `getOnboardingRedirect`.

## INTAKE_COLUMNS mapping (DO NOT REORDER OR RENAME)

```
companySnapshot     -> basic_info
functionSelector    -> business_model
functionDeepDives   -> content_messaging   (array of rows; function_id = canonical slug)
toolStack           -> tools_systems       (array of rows)
goals               -> goals
people              -> social_presence     (array of rows)
guardrails          -> challenges
market              -> target_audience
brandVoice          -> brand_voice
accessInventory     -> competitors         (array of rows)
```

Legacy v1 schema names are intentional — no migration available from deploy env. If migration 013 ships, switch to semantic names in one edit.

## Bot tool-call rules (HARD)

1. **USER-FORCED SAVE override** — when client says "save", "save and move on", "next", "next section", "move on", "approved", "looks good", "ship it", "manda", "salva", "proceed", "we can move on", "done", "that's all", "finalize", "go ahead" → emit appropriate persistence tool in SAME turn. Server flips `tool_choice` to `"required"` on iter 0 when trigger matches and current section is not `logistics`, so LLM literally cannot reply with prose-only.
2. **REPEATABLE BATCH SAVES** — when client pastes multi-row block, emit ALL `add_repeatable_row` calls + `complete_repeatable_section` in SAME turn.
3. **FUNCTION_ID NORMALIZATION** — deep-dive `function_id` MUST be canonical BUSINESS_FUNCTIONS slug. Server-side `normalizeFunctionId` also rewrites the incoming arg as belt-and-suspenders.
4. **AUTOMATION MAP GUARD** — `generateAutomationMap` with `feedback === null` blocks if any of the 10 required jsonb sources empty. Returns error listing missing section ids; bot must loop back.

## Backfill / data ops

`mcp__supabase__execute_sql` is READ-ONLY for the project. To UPDATE rows:
1. `cd /tmp/client-portal && vercel env pull .env.local --environment=production --yes` (pulls SUPABASE_SERVICE_ROLE_KEY)
2. Python with `urllib.request` PATCHing `<url>/rest/v1/<table>?<col>=eq.<val>` with both `apikey` and `Authorization: Bearer <key>`, `Prefer: return=representation`.

Patterns saved in `/tmp/backfill-cassidy.py`, `/tmp/dedupe-dives.py`, `/tmp/provision-gordon.py`, `/tmp/provision-cassidy.py`.

## Deploy

PAMF2 has `push:false` on this repo (Pedro's GH account is org member but not in a write team). Until access is granted: `cd /tmp/client-portal && vercel --prod --yes` from local commits. Code stays on Vercel only; not in upstream GitHub. Risk: next Dilan/Chris push overwrites Vercel build. Once `git push origin main` works, switch back to git-driven deploys.

Local commits to push when access lands:
- `155d578` fix(onboarding): auto-redirect to /dashboard 2.5s after completion
- + uncommitted: USER-FORCED SAVE prompt + normalizeFunctionId + automation-map guard + adaptive tool_choice

## Known bugs to watch

- **LLM tool-call drift in long flows** — the depth-gate prompt over-trains conversational reflex. Mitigated by 3-layer fix above. Watch for any narrative section with 2-byte (`{}`) jsonb after a completed onboarding → fix slipping.
- **`additional_context.insights`** referenced in `generateAutomationMap` but not populated anywhere I've seen. Safe default `[]`.
- **`tools_systems` / `content_messaging` / `social_presence` / `competitors` jsonb default** — must be `[]::jsonb`, not `{}`. Migration applied for new clients but verify on any new client where `(...).filter is not a function` errors appear.

## Client provisioning

```sql
INSERT INTO clients (email, name, company, role, status, onboarding_step)
VALUES ('user@example.com', 'Full Name', 'Company Inc', 'client', 'onboarding', 1);
```

Then send the client portal.rawgrowth.ai + their email — they enter it on /login and they're in.

## Active clients

- pedroafonsomalheiros30@gmail.com (Pedro, test row, active)
- ghuckestein@cardiacdirect.com (Gordon, Cardiac Direct, onboarding step 1 — never logged in)
- tcassidy@mdprousa.com (Thomas Cassidy, Raine Industries / MDPro, active, intake backfilled)

## Pedro's preferences

- Caveman/terse responses (Portuguese-English code-switch fine in internal); first-person opinionated; no em-dashes, no corporate fluff, no emojis.
- Verify before claiming done (run tests / curl / SQL output, never `"deploy ok"` without proof).
- Never push without explicit chat approval. Never use destructive git ops (`reset --hard`, `push --force`) without explicit ask.
- See user-level `~/.claude/CLAUDE.md` for full ruleset.
