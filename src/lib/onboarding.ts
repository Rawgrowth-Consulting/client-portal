import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * ────────────────────────────────────────────────────────────────────────────
 * Company Operating Profile (COP) — operations-first onboarding model
 * ────────────────────────────────────────────────────────────────────────────
 * North star: map every nook and cranny of the client's business operations —
 * how they work, their full tool stack, bottlenecks, and goals — so we finish
 * onboarding knowing exactly WHAT to automate and HOW. The headline output is a
 * Business Process & Automation Map, NOT a brand profile. Brand/voice is
 * supporting context so the automations sound like the company.
 *
 * Spec: ops/strategy/onboarding-redesign-2026-05.md
 *
 * Design rules baked in here:
 *  • Operations layer is FRONT-LOADED (decision: deep operational layer first).
 *  • Tools are INVENTORIED, not connected live (decision: inventory only).
 *  • HARD completion rules: every section declares `required` field keys that
 *    MUST be captured before the flow can advance. The chat route enforces this.
 *  • Voice: we never record voice notes — we recommend Wispr Flow for fast,
 *    fuller, spoken answers typed straight into the box.
 */

// ── Wispr Flow nudge ─────────────────────────────────────────────────────────
// Shown once at the start so clients can speak long answers instead of typing.
export const WISPR_FLOW_URL = "https://wisprflow.ai";
export const WISPR_FLOW_NUDGE =
  "Tip: a lot of these answers are richer when you just talk them through. We recommend installing **[Wispr Flow](https://wisprflow.ai)** — it turns your speech into text in any box, so you can speak full answers instead of typing. The more detail you give, the better your AI department works.";

// ── Capture kinds ────────────────────────────────────────────────────────────
export type SectionKind =
  | "logistics" // operational onboarding steps (comms, calls)
  | "narrative" // conversational, one JSONB object
  | "repeatable" // conversational, an array of rows (deep-dives, tools, people)
  | "uploader" // inline file uploader
  | "generated"; // system-generated artifact (the Automation Map)

export interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
}

export interface OnboardingSection {
  id: string;
  /** Client-facing section title. */
  label: string;
  /** Internal pillar (A–J) from the spec. */
  pillar: string;
  kind: SectionKind;
  /** brand_intakes JSONB column this section writes to (narrative + repeatable). */
  column?: string;
  /** One short, plain-language line telling the client what this section is for. */
  intro: string;
  /** For narrative sections: the field catalog (required gating lives here). */
  fields?: FieldDef[];
}

// ── Business functions (Pillar D selector) — MECE value chain for the ICP ─────
export const BUSINESS_FUNCTIONS: Array<{ id: string; label: string }> = [
  { id: "marketing", label: "Marketing & Content (demand generation)" },
  { id: "sales", label: "Sales (lead → close)" },
  { id: "delivery", label: "Delivery / Fulfillment (the actual product/service)" },
  { id: "success", label: "Customer Success / Support / Retention" },
  { id: "operations", label: "Operations & Admin (scheduling, internal comms, PM, docs)" },
  { id: "finance", label: "Finance (billing, invoicing, reporting, collections)" },
  { id: "people", label: "People / Talent (hiring, onboarding, management)" },
  { id: "product", label: "Product / R&D" },
  { id: "leadership", label: "Leadership / Chief-of-Staff (founder's own time)" },
];

// ── Tool-stack categories (Pillar E inventory → Composio connection list) ─────
export const TOOL_CATEGORIES: Array<{ id: string; label: string; examples: string }> = [
  { id: "crm", label: "CRM", examples: "GoHighLevel, HubSpot, Close, Salesforce" },
  { id: "project", label: "Project / Task management", examples: "ClickUp, Asana, Notion, Monday, Trello" },
  { id: "comms", label: "Team communication", examples: "Slack, Microsoft Teams, Telegram, email" },
  { id: "calendar", label: "Calendar / Scheduling", examples: "Google Calendar, Calendly, Outlook" },
  { id: "docs", label: "Docs / Knowledge / Storage", examples: "Google Drive, Notion, Dropbox, SharePoint" },
  { id: "finance", label: "Finance / Billing", examples: "Stripe, QuickBooks, Xero, Bill.com" },
  { id: "marketing", label: "Marketing (email, social, ads)", examples: "Mailchimp, Meta Ads, ActiveCampaign, Beehiiv" },
  { id: "analytics", label: "Analytics / Reporting", examples: "Google Analytics, Mixpanel, Metabase" },
  { id: "support", label: "Support / Helpdesk", examples: "Intercom, Zendesk, Front, Help Scout" },
  { id: "industry", label: "Industry-specific tools", examples: "anything specific to your niche" },
];

// ── Per-row schemas for repeatable sections ──────────────────────────────────

/** One Function Deep-Dive row = one candidate automation. (Pillar D) */
export const FUNCTION_DEEPDIVE_FIELDS: FieldDef[] = [
  { key: "function_id", label: "Which function", required: true },
  { key: "workflow", label: "The repeatable workflow (trigger → steps → output)", required: true },
  { key: "owner", label: "Who owns it today", required: true },
  { key: "hours_per_week", label: "Hours/week + how often it runs + volume", required: true },
  { key: "outputs", label: "What it produces (proposal, post, invoice, report…)", required: true },
  { key: "tools_touched", label: "Which tools/systems this workflow touches", required: true },
  { key: "recipient", label: "Who receives the output / who approves it", required: true },
  { key: "quality_bar", label: "What 'great' looks like vs. 'unacceptable'", required: false },
  { key: "pain", label: "What's most repetitive, boring, or error-prone here", required: true },
  { key: "existing_sop", label: "Any existing SOP/script/template (link or 'none')", required: false },
  { key: "sales_scripts", label: "[Sales] Scripts / talk tracks you use (paste or link)", required: false },
  { key: "call_recordings_ref", label: "[Sales] Where call recordings live (link or 'none')", required: false },
  { key: "proposal_process", label: "[Sales] How proposals/quotes get built and sent", required: false },
  { key: "follow_up_process", label: "[Sales] Your follow-up cadence after a call/proposal", required: false },
];

/** One Tool Inventory row. (Pillar E — the Composio connection source) */
export const SYSTEM_FIELDS: FieldDef[] = [
  { key: "category", label: "Category", required: true },
  { key: "product", label: "Product name + plan/tier", required: true },
  { key: "admin", label: "Who is the admin / account owner", required: true },
  { key: "data_held", label: "What data lives here", required: true },
  { key: "access_intent", label: "Should the agent read / write / both", required: true },
  { key: "priority", label: "Connect priority (must-have for v1 / later)", required: true },
];

/** One Person row. (Pillar F) */
export const PERSON_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role", required: true },
  { key: "functions", label: "Which function(s) they own", required: true },
  { key: "decision_maker", label: "Are they a decision-maker/approver?", required: true },
];

// ── Physical column mapping ──────────────────────────────────────────────────
// The new operations-first model reuses the EXISTING brand_intakes JSONB columns
// (created in migration 005) rather than new columns. This lets the redesign ship
// with ZERO schema migration — important because prod DDL isn't available from
// the deploy environment. Each logical section maps to one existing column;
// arrays (deep-dives, tools, people, access) live in JSONB columns just fine.
// If migration 013 is later applied, switch these to the semantic names.
export const INTAKE_COLUMNS: Record<string, string> = {
  companySnapshot: "basic_info",
  functionSelector: "business_model",
  functionDeepDives: "content_messaging",
  toolStack: "tools_systems",
  goals: "goals",
  people: "social_presence",
  guardrails: "challenges",
  market: "target_audience",
  brandVoice: "brand_voice",
  accessInventory: "competitors",
};

// ── The ordered flow (operations-first) ──────────────────────────────────────
export const SECTIONS: OnboardingSection[] = [
  {
    id: "comms",
    label: "How we reach you",
    pillar: "J",
    kind: "logistics",
    intro: "First, the channel your AI department will message you on day-to-day.",
  },
  {
    id: "companySnapshot",
    label: "Company snapshot",
    pillar: "A",
    kind: "narrative",
    column: INTAKE_COLUMNS.companySnapshot,
    intro: "A fast snapshot of what your business is and sells — so everything below has context.",
    fields: [
      { key: "what_you_sell", label: "What you sell (offers + rough pricing)", required: true, hint: "List each core offer and its price/model." },
      { key: "business_model", label: "How you make money (revenue streams)", required: true },
      { key: "scale", label: "Scale (annual revenue band, team size, years operating)", required: true },
      { key: "one_liner", label: "One-line description ('we help X do Y')", required: true },
    ],
  },
  {
    id: "functionSelector",
    label: "Where the work happens",
    pillar: "D",
    kind: "narrative",
    column: INTAKE_COLUMNS.functionSelector,
    intro: "Which parts of the business you run, and which ones eat the most time. This decides what we go deep on next.",
    fields: [
      { key: "active_functions", label: "Which functions you actively run", required: true, hint: `Choose from: ${BUSINESS_FUNCTIONS.map((f) => f.label).join("; ")}` },
      { key: "time_drains", label: "Which 1–3 of those eat the most time/cause the most pain", required: true },
    ],
  },
  {
    id: "functionDeepDives",
    label: "How each part actually runs",
    pillar: "D",
    kind: "repeatable",
    column: INTAKE_COLUMNS.functionDeepDives,
    intro: "Now the important part: a deep-dive on how each area runs today. Be specific — this is what we automate.",
  },
  {
    id: "toolStack",
    label: "Your tool stack",
    pillar: "E",
    kind: "repeatable",
    column: INTAKE_COLUMNS.toolStack,
    intro: "Every tool your business runs on. This becomes the map of what we connect and automate.",
  },
  {
    id: "goals",
    label: "Goals & bottlenecks",
    pillar: "G",
    kind: "narrative",
    column: INTAKE_COLUMNS.goals,
    intro: "Where you want to be, and what's standing in the way — so we automate the highest-leverage things first.",
    fields: [
      { key: "goal_90d", label: "90-day goal", required: true },
      { key: "vision_12mo", label: "12-month vision / where you want to be", required: true },
      { key: "top_bottlenecks", label: "Top 3 bottlenecks across the whole business", required: true },
      { key: "ten_hours_back", label: "If you got 10 hours/week back, where would they come from?", required: true },
      { key: "tried_failed", label: "What you've tried before that didn't work", required: false },
    ],
  },
  {
    id: "people",
    label: "Your team",
    pillar: "F",
    kind: "repeatable",
    column: INTAKE_COLUMNS.people,
    intro: "The key people the agents will work with, route to, or get approvals from.",
  },
  {
    id: "guardrails",
    label: "Guardrails",
    pillar: "H",
    kind: "narrative",
    column: INTAKE_COLUMNS.guardrails,
    intro: "The rules of engagement — what your AI department can do on its own vs. what needs your sign-off.",
    fields: [
      { key: "autonomy_default", label: "Default: should agents draft-for-approval, or act autonomously?", required: true },
      { key: "no_gos", label: "Hard no-gos (claims you can't make, regulated language, off-limits topics)", required: true },
      { key: "data_sensitivity", label: "What must never leave the company / never be sent externally", required: true },
      { key: "escalation", label: "When should an agent stop and ask a human?", required: true },
      { key: "approval_boundaries", label: "Where exactly is the line between act-on-your-own and needs-approval (dollar amounts, customer-facing sends, etc.)", required: false },
      { key: "agents_never_touch", label: "Anything agents should never touch (systems, accounts, decisions)", required: false },
    ],
  },
  {
    id: "market",
    label: "Market & customers",
    pillar: "B",
    kind: "narrative",
    column: INTAKE_COLUMNS.market,
    intro: "Who you serve — so the agents speak to the right people about the right things.",
    fields: [
      { key: "icp_segments", label: "Your ideal-client segment(s): who they are + top pains + dream outcome", required: true },
      { key: "objections", label: "The main objection(s) you hear", required: true },
      { key: "competitors", label: "Main competitors + how you're different", required: true },
      { key: "positioning", label: "Your positioning / category", required: false },
      { key: "best_customers", label: "Your best customers — who they are and why they're a great fit", required: false },
      { key: "worst_customers", label: "Your worst-fit customers — who you'd rather not take on", required: false },
      { key: "trigger_events", label: "What triggers someone to start looking for you (the buying trigger)", required: false },
      { key: "current_alternatives", label: "What they use / do today instead of you", required: false },
      { key: "why_buy", label: "Why customers ultimately buy from you", required: false },
      { key: "why_not_buy", label: "Why prospects don't buy / walk away", required: false },
    ],
  },
  {
    id: "brandVoice",
    label: "Brand & voice",
    pillar: "C",
    kind: "narrative",
    column: INTAKE_COLUMNS.brandVoice,
    intro: "How your brand should sound, so anything the agents produce sounds like you wrote it.",
    fields: [
      { key: "voice_description", label: "How would you describe your voice/tone", required: true },
      { key: "never_say", label: "Words/phrases to never use", required: true },
      { key: "signature_phrases", label: "Signature phrases / things you always say", required: false },
      { key: "messaging_pillars", label: "Core messaging pillars / hot takes", required: false },
      { key: "examples_good_copy", label: "Examples of copy that sounds right (paste 1-2 samples or links)", required: false },
      { key: "examples_bad_copy", label: "Examples of copy that sounds wrong / off-brand", required: false },
    ],
  },
  {
    id: "brandDocs",
    label: "Brand assets",
    pillar: "C",
    kind: "uploader",
    intro: "Drop in your logos, brand guidelines, palette, and fonts (upload the real files — we won't guess).",
  },
  {
    id: "knowledgeAssets",
    label: "Knowledge & playbooks",
    pillar: "I",
    kind: "uploader",
    intro: "Your SOPs, scripts, templates, FAQs, and call recordings — the raw material your agents learn from.",
  },
  {
    id: "accessInventory",
    label: "Access & connections",
    pillar: "J",
    kind: "repeatable",
    column: INTAKE_COLUMNS.accessInventory,
    intro: "We'll inventory which tools to connect now — your team wires them up afterward, no setup work for you here.",
  },
  {
    id: "scheduleCall",
    label: "Kickoff call",
    pillar: "J",
    kind: "logistics",
    intro: "Last step — book your Week 1 kickoff so we can walk you through the build.",
  },
  {
    id: "automationMap",
    label: "Your automation map",
    pillar: "—",
    kind: "generated",
    intro: "We'll generate your Business Process & Automation Map for you to review.",
  },
];

// ── Hard completion rules ────────────────────────────────────────────────────
/** Required field keys per narrative section. Empty array → the section's own rule applies. */
export const REQUIRED_FIELDS: Record<string, string[]> = Object.fromEntries(
  SECTIONS.filter((s) => s.kind === "narrative").map((s) => [
    s.id,
    (s.fields ?? []).filter((f) => f.required).map((f) => f.key),
  ])
);

/** Returns the required field keys still missing from a captured-data object. */
export function missingRequired(sectionId: string, data: Record<string, any> | null | undefined): string[] {
  const req = REQUIRED_FIELDS[sectionId] ?? [];
  const d = data ?? {};
  return req.filter((k) => {
    const v = d[k];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });
}

/** Hard rule for the Function Deep-Dives: every active function needs a complete row. */
export function deepDivesComplete(
  activeFunctions: string[] | undefined,
  rows: Array<Record<string, any>> | undefined
): { complete: boolean; missingFunctions: string[]; incompleteRows: string[] } {
  const active = activeFunctions ?? [];
  const byFn = new Map((rows ?? []).map((r) => [r.function_id, r]));
  const reqKeys = FUNCTION_DEEPDIVE_FIELDS.filter((f) => f.required).map((f) => f.key);
  const missingFunctions = active.filter((fn) => !byFn.has(fn));
  const incompleteRows: string[] = [];
  for (const [fn, row] of byFn) {
    const missing = reqKeys.filter((k) => !row?.[k] || String(row[k]).trim() === "");
    if (missing.length) incompleteRows.push(`${fn}: missing ${missing.join(", ")}`);
  }
  return {
    complete: missingFunctions.length === 0 && incompleteRows.length === 0,
    missingFunctions,
    incompleteRows,
  };
}

// ── Brand-doc upload zones (kept; Pillar C) ──────────────────────────────────
export const BRAND_DOC_ZONES: Array<{
  id: "logo" | "guideline" | "asset";
  label: string;
  accept: string;
  description: string;
}> = [
  { id: "logo", label: "Logo Files", accept: ".png,.svg,.ai,.eps,.jpg,.jpeg,.pdf", description: "PNG, SVG, AI, EPS, or PDF" },
  { id: "guideline", label: "Brand Guidelines", accept: ".pdf,.doc,.docx,.txt", description: "PDF, DOC, DOCX, or text" },
  { id: "asset", label: "Other Brand Assets", accept: "*", description: "Colors, fonts, templates, anything else" },
];

// ── Knowledge-asset upload zones (Pillar I) ──────────────────────────────────
export const KNOWLEDGE_DOC_ZONES: Array<{
  id: "sop" | "script" | "recording";
  label: string;
  accept: string;
  description: string;
}> = [
  { id: "sop", label: "SOPs & Playbooks", accept: ".pdf,.doc,.docx,.txt,.md", description: "Process docs, how-to guides" },
  { id: "script", label: "Scripts, Templates & FAQs", accept: ".pdf,.doc,.docx,.txt,.md", description: "Sales scripts, email/proposal templates, FAQs" },
  { id: "recording", label: "Call Recordings / Transcripts", accept: "*", description: "Files or paste a link (Fireflies, Drive)" },
];

// ── Kickoff call (Pillar J) ──────────────────────────────────────────────────
export const SCHEDULE_CALLS: Array<{
  id: string;
  title: string;
  description: string;
  month: number;
  week: number;
}> = [
  {
    id: "week1",
    title: "Week 1 Kickoff",
    description: "Meet the team, review your automation map, set Month 1 goals",
    month: 1,
    week: 1,
  },
];

export const CALENDLY_BASE_URL = "https://calendly.com/chriswestt/rawgrowth-discovery";

// Backwards-compat: the chat route still imports these names. The access
// inventory (Pillar E/J) replaces the old hardcoded "add chris as admin" list.
export const SOFTWARE_ACCESS_PLATFORMS = TOOL_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  steps: [] as string[],
}));

// 16 sections in the flow.
export const TOTAL_ONBOARDING_STEPS = SECTIONS.length;

export interface OnboardingProgress {
  current: number;
  total: number;
  completed: string[];
}

export async function computeOnboardingProgress(
  userId: string
): Promise<OnboardingProgress> {
  const completed: string[] = [];

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("messaging_channel, onboarding_step, status")
    .eq("id", userId)
    .maybeSingle();

  const step = client?.onboarding_step ?? 1;

  // Section 1 — comms
  if (client?.messaging_channel) completed.push("comms");

  // Pull the intake once and evaluate each narrative/repeatable section.
  const { data: intake } = await supabaseAdmin
    .from("brand_intakes")
    .select("*")
    .eq("client_id", userId)
    .maybeSingle();

  const intakeObj = (intake ?? {}) as Record<string, any>;

  for (const section of SECTIONS) {
    if (!section.column) continue;
    const value = intakeObj[section.column];

    if (section.kind === "narrative") {
      if (value && typeof value === "object" && missingRequired(section.id, value).length === 0) {
        completed.push(section.id);
      }
    } else if (section.kind === "repeatable") {
      if (Array.isArray(value) && value.length > 0) {
        if (section.id === "functionDeepDives") {
          const active = (intakeObj[INTAKE_COLUMNS.functionSelector]?.active_functions ?? []) as string[];
          if (deepDivesComplete(active, value).complete) completed.push(section.id);
        } else {
          completed.push(section.id);
        }
      }
    }
  }

  // Uploaders + generated + logistics are step-gated (advanced by the route).
  if (step >= stepIndex("brandDocs") + 1) completed.push("brandDocs");
  if (step >= stepIndex("knowledgeAssets") + 1) completed.push("knowledgeAssets");
  if (step >= stepIndex("scheduleCall") + 1) completed.push("scheduleCall");

  // Automation map approved?
  const { data: approvedProfile } = await supabaseAdmin
    .from("brand_profiles")
    .select("id")
    .eq("client_id", userId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (approvedProfile) completed.push("automationMap");

  if (client?.status === "active") {
    // fully done — mark everything complete
    for (const s of SECTIONS) if (!completed.includes(s.id)) completed.push(s.id);
  }

  return {
    current: new Set(completed).size,
    total: TOTAL_ONBOARDING_STEPS,
    completed: [...new Set(completed)],
  };
}

/** Index of a section in the flow (0-based). */
export function stepIndex(sectionId: string): number {
  return SECTIONS.findIndex((s) => s.id === sectionId);
}
