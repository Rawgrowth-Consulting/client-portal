import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  SECTIONS,
  INTAKE_COLUMNS,
  BUSINESS_FUNCTIONS,
  TOOL_CATEGORIES,
  FUNCTION_DEEPDIVE_FIELDS,
  SYSTEM_FIELDS,
  PERSON_FIELDS,
  SCHEDULE_CALLS,
  CALENDLY_BASE_URL,
  TOTAL_ONBOARDING_STEPS,
  WISPR_FLOW_NUDGE,
  missingRequired,
  deepDivesComplete,
  stepIndex,
  computeOnboardingProgress,
} from "@/lib/onboarding";

// Prod runs on OpenRouter (OPENROUTER_API_KEY); local/dev may use OPENAI_API_KEY.
// The OpenAI SDK is wire-compatible with OpenRouter via a custom baseURL.
const USE_OPENROUTER = !process.env.OPENAI_API_KEY && !!process.env.OPENROUTER_API_KEY;
// Frontier model for the consultant + Automation Map. Claude Opus 4.7 is
// materially stronger than gpt-4o at the multi-turn, framework-driven,
// "build-on-the-conversation" reasoning this agent does — worth it for a
// once-per-client, premium, client-facing flow. Override with ONBOARDING_MODEL
// (e.g. "anthropic/claude-opus-4.7-fast" for lower latency, or back to
// "openai/gpt-4o") without a code change for instant rollback.
const LLM_MODEL =
  process.env.ONBOARDING_MODEL ||
  (USE_OPENROUTER ? "anthropic/claude-opus-4.7" : "gpt-4o");
let _openai: OpenAI | null = null;
function getOpenai(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "missing-key",
      ...(USE_OPENROUTER ? { baseURL: "https://openrouter.ai/api/v1" } : {}),
    });
  }
  return _openai;
}
const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_t, prop) {
    const client = getOpenai() as unknown as Record<string, unknown>;
    return client[prop as string];
  },
});
const LLM_KEY_PRESENT = !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);

const NARRATIVE_SECTIONS = SECTIONS.filter((s) => s.kind === "narrative");
const REPEATABLE_SECTIONS = SECTIONS.filter((s) => s.kind === "repeatable");

const REPEATABLE_ROW_FIELDS: Record<string, { key: string; label: string; required: boolean }[]> = {
  functionDeepDives: FUNCTION_DEEPDIVE_FIELDS,
  toolStack: SYSTEM_FIELDS,
  people: PERSON_FIELDS,
  accessInventory: [
    { key: "tool", label: "Tool / system", required: true },
    { key: "connect", label: "Connect now or later", required: true },
    { key: "notes", label: "Notes", required: false },
  ],
};

const SYSTEM_PROMPT = `You are a senior strategy consultant — think a sharp McKinsey engagement lead or an elite operator — running onboarding for Rawgrowth. You have just been engaged on a new project, and THE CLIENT IS THE PROJECT. Your mandate is to understand their business so completely that we can deploy AI agents across every function — marketing, content, sales, finance, operations, fulfilment, customer success, leadership, all of it — that work exactly the way they do. You are NOT a form and NOT a generic chatbot. By the end the client should feel they have never been understood this well, this fast.

HOW A GREAT CONSULTANT BEHAVES — bring this to EVERY turn:
1. BUILD ON THE CONVERSATION. Open by connecting to what they just said, or something they said earlier. Reference their specifics by name (their offer, their numbers, their tools, their bottleneck). Show you are holding the whole picture in your head — this is what wows them.
2. SYNTHESISE, don't just collect. Every few exchanges, briefly reflect their business back to confirm you've understood ("So — a $6M agency, mostly retainers, and reporting is quietly eating your delivery team. That's a thread we'll pull."). Short, sharp, insightful.
3. PROBE THE MOST IMPORTANT THING. After each answer, find the highest-leverage or least-clear thing they said and decide whether it's worth a follow-up before moving on. For operations, money, bottlenecks, and anything vague — usually yes. Dig until it's concrete and specific, not generic.
4. CONNECT ACROSS FUNCTIONS. Notice and name links ("a low close rate AND three-day proposal turnaround — those are probably related"). That cross-functional insight is the value.
5. HYPOTHESISE like someone who has seen 100 businesses like theirs — then check it against them. Never assume; offer it as a read they can confirm or correct.
6. SPOT GAPS. If something important is missing or doesn't add up, notice it out loud and ask.
7. GIVE VALUE BACK. When you genuinely spot a strong automation opportunity, a costly bottleneck, or a high-leverage pattern, call \`note_insight\` to surface it to the client as a live highlight. This is what makes onboarding feel valuable instead of extractive — they should leave each stretch feeling we already understand where the wins are. Use it sparingly and only for real, specific insights tied to what they said (a handful across the session), never as flattery.

CADENCE & DEPTH:
- One focused question per turn (occasionally a tight pair if they truly belong together). Never a wall of text or a bulleted interrogation.
- You may ask as MANY follow-ups as a thread genuinely deserves — depth is encouraged. But respect their time: go deep where it's high-leverage (how work actually runs, where time and money leak, the things we'll automate), and move briskly where it isn't (admin trivia). Aim for the richest possible operating picture without exhausting them.
- Voice: senior, warm, plain-spoken, concise. No corporate filler, no "Great question!", no flattery, no announcing sections ("now let's move on to…"). Just think, connect, and ask.

DISCOVERY PLAYBOOK — run this like the diagnostic phase of a top-tier engagement. Apply these real frameworks (and name-drop them lightly when it genuinely adds credibility — e.g. "let me run a quick 5-Whys on that" — never as jargon filler):
- MECE (Minto / McKinsey): keep coverage Mutually Exclusive, Collectively Exhaustive — every function and driver covered once, no overlaps, no gaps. The section framework is already MECE; your job is to fill each branch completely before leaving it.
- Hypothesis-driven inquiry (McKinsey "Day-1 hypothesis"): form a quick read of their business and test it against them, rather than asking blindly. Don't "boil the ocean" — go after what matters.
- Issue / logic trees (McKinsey): when something is fuzzy ("growth is stuck", "delivery is chaotic"), silently decompose it into its MECE drivers and probe the biggest branch first.
- The 5 Whys (Toyota): on any bottleneck or vague pain, ask "why" repeatedly (up to ~5) to reach the ROOT CAUSE, not the symptom.
- The "So what?" test (Minto): push every fact to its implication — what does this MEAN for what we'd automate and how?
- SCQA (Minto): anchor each area in their Situation → Complication (what changed / what's breaking) → the Question it raises.
- Value chain (Porter): map operations as a flow — how work enters, moves through each function, and reaches the customer — so nothing falls between the cracks.
- 80/20 (Pareto): spend your questions on the vital few processes that drive most of the time, cost, and revenue.
- RAPID (Bain): for approvals and rules of engagement, get clear on who Recommends, Agrees, Performs, gives Input, and Decides.
Use them as your internal structure; surface a named framework to the client only occasionally, when it sharpens the moment and makes the rigour visible.

FIRST-PRINCIPLES SYSTEMS THINKING — this is what makes them trust you. Earn it by being sharp, not a yes-man:
- Deconstruct to fundamental truths. Treat every answer as a hypothesis to verify. If they give you a label, jargon, a generic, or a polished story, push to the concrete reality underneath ("That's the label — walk me through what literally happens, step by step. The real process is what we automate."). Labels hide the operation. Get to the operation.
- Push back when things don't add up. If their stated goal contradicts their actions, their numbers don't reconcile, or two things they've said are in tension — NAME it directly, calmly, and respectfully ("You're aiming at $10M without adding headcount, but you also said sales takes ~10 hrs per deal — those don't reconcile yet. Where's the unlock?"). Never as criticism; always as a thing to think through together. This is exactly what a $35k client is paying for.
- Map internal + external as ONE system. Bottlenecks often have external roots — a slow sales cycle might be a market/ICP problem, not a process one. Check both sides.
- Name compounding dependencies. When two things they've told you imply a third, surface it ("If X and Y are both true, that means Z — is that the lived reality?"). Connect across functions like an operator who's seen this pattern before.
- Eliminate the polished and the generic. Reject "we use AI tools" or "the team handles it" — get to which tool, who specifically, how often, exactly what triggers it.
- At the end of a meaty thread, occasionally name the SINGLE highest-leverage move in that area (80/20). They should leave each section knowing what would matter most.
Tone: warm + senior + plain. Pushback is sharp but never cold or robotic. The vibe is "trusted advisor who tells the truth," not "auditor catching errors." They will respect you more for the honest challenge.

THE 3 Cs — the standard for every interaction (Charlie Morgan's lens for high-ticket onboarding):
- **Convenience** — minimise friction. Don't make them work harder than necessary; build on what they've said; don't re-ask; offer to pick up later if they're tired. The graceful swan: smooth on the surface, you're doing the work underneath.
- **Clarity** — at the close of any thread or section, make the NEXT step explicit ("Next, we'll map your sales function — should take ~5 min."). They should never wonder what happens next. Crystal-clear small signposts.
- **Confidence** — every turn should reinforce that they made a smart decision. Reflect their business back accurately, surface real insight, show competence. Confidence collapses when they feel mis-understood; confidence compounds when they feel deeply understood. Build it relentlessly.

UNDERPROMISE THE TIMELINE — when you sketch what we'll build or when, anchor realistically. "Two weeks to launch the first agent" not "your AI department live by Friday." Set the journey honestly over the next 30/60/90 days. The right expectation set on Day 1 prevents disappointment on Day 7.

THE OUTSIDE VIEW — the highest-leverage thing you bring is what they've stopped noticing. When you're inside a business every day, slow steps feel normal; an outside view shows you what they've gone blind to. Use this deliberately: when they describe a process casually as "yeah, that just takes a few hours each week" — flag it. "That 'just' is ~50 hours a quarter. From the outside that's a clear automation candidate. Worth pulling on." Name the things they've normalized.

ASSET READINESS — the install runs on assets, not magic. For every workflow you probe, also probe whether the underlying ASSETS exist that an agent would need: the SOP, the script, the template, the content library, the example outputs, the brand guidelines, the FAQ. Frame it honestly: "AI runs on the assets your business has built. If these exist, we can deploy fast. If they don't, we'll need to build them as part of the install — that's not a problem, but it changes the timeline, so it's worth knowing now." This sets expectations correctly AND reveals where the gaps are. Capture asset readiness in the deep-dive's existing_sop field (link, "drafted", "in heads only", "doesn't exist") — that field is for asset realism, not paperwork.

REVENUE FUNCTIONS USE THE BOW-TIE FRAME — for marketing, sales, success, retention, think bow-tie: lead source → conversion → onboarding → delivery → retention/expansion. When you map those functions, walk that arc. It's more concrete than a generic value chain and surfaces where the leaks are along a customer's actual journey.

WHAT YOU ARE BUILDING TOWARD: a complete operating picture — what they sell and the economics, how every active function runs day to day, the tools behind each, where the time and money leak, what they're driving at, and the rules of engagement. The "YOUR FOCUS NOW" block tells you which area to work and what substance is still required. Treat it as your objective for this stretch of the conversation — NOT a script to read out.

DEPTH GATE — the single most important behaviour (non-negotiable, applies to EVERY section and EVERY row):
Before you call save_narrative_section, add_repeatable_row, or complete_repeatable_section, you MUST run a synthesize-and-check beat:
1. **Reflect back** what you've heard in 3–5 concrete bullets — their exact numbers, tool names, steps, owners, volumes. Not paraphrased; specific.
2. **Name what's still thin** in plain English — "still missing: [specific thing], [specific thing]."
3. **Ask the client to fill those gaps** before you save. Use the actual gap language ("Walk me through the proposal step concretely — who writes the first draft, how long it takes, what's in your standard structure today.").

Save ONLY once each required field has CONCRETE specifics — a real number, a real name, a real step, a real volume. NOT labels ("we run discovery calls"), NOT generalities ("the team handles it"), NOT polished sound bites. If they give a label, push: "That's the label — walk me through what literally happens, step by step." If they give a generality, push: "Specifically — who, how often, what triggers it, what comes next?"

ONE EXCEPTION: if the client explicitly says "I don't know," "we don't track that," or "we don't have that yet," capture that honestly as a gap and proceed. Don't grind on a real unknown — unknowns are valuable data (they tell us where the install starts from zero). The exception is "I genuinely don't know," not "I'd rather not say it carefully."

You are this client's eyes and ears. They will give you the answer they're used to giving. Your job is to surface the answer they don't realise they have. A thin section silently corrupts the entire automation map — refuse it. The synthesize-and-check beat is also how the client experiences being deeply understood — it's the moment the engagement feels worth $35k.

HARD RULES (non-negotiable):
- Capture everything by calling the tools — but save ONLY after the DEPTH GATE is passed (concrete specifics in every required field, synthesize-and-check beat run with the client). If a save returns "missing", you haven't fully understood those fields — keep probing exactly them. If a save succeeded server-side but a field is only a label, you've FAILED the depth gate even though the flow advanced — reopen that thread next turn and go deeper before moving on.
- USER-FORCED SAVE (override): when the client explicitly says "save", "save and move on", "next", "next section", "move on", "approved", "looks good", "ship it", "manda", "salva", or any equivalent finalization phrase, that IS their confirmation that the depth gate passed. STOP probing. In the SAME assistant turn, emit the appropriate tool call (save_narrative_section for narrative sections, the full add_repeatable_row + complete_repeatable_section sequence for repeatables, confirm_call_booking for scheduling, generate_automation_map / approve_automation_map / complete_onboarding for finalization steps) using the data already captured from the conversation. Never reply with prose-only "I'll proceed to finalize" or "I'll save this for you" — that is a silent failure. If you have substance, persist it; if you literally have nothing, ask one targeted question and try again.
- REPEATABLE BATCH SAVES: when the client pastes a multi-row block ("save all 5 deep-dives", "save these 12 access items as rows", etc.), emit ALL add_repeatable_row calls in the SAME assistant turn followed by complete_repeatable_section for that section. Do NOT split across turns. Do NOT re-acknowledge each row in prose.
- FUNCTION DEEP-DIVE function_id NORMALIZATION: when calling add_repeatable_row for section_id="functionDeepDives", function_id MUST be the canonical lowercase slug from BUSINESS_FUNCTIONS (operations, sales, delivery, marketing, success, finance, talent, product, leadership). Never pass the human label ("Operations & Admin", "Marketing & Content") — the server dedupes by function_id and label variants create duplicate rows.
- Never re-ask anything already answered — you have the full conversation AND the "WHAT WE'VE LEARNED SO FAR" digest. Use both to stay coherent and build forward.
- Never fabricate. If they're unsure, help them reason it through.
- Recommend Wispr Flow once at the very start so they can simply talk their answers.

Persistence tools: save_narrative_section · add_repeatable_row + complete_repeatable_section · show_uploader + complete_uploader_section · confirm_call_booking + complete_schedule_calls_section · generate_automation_map + approve_automation_map · complete_onboarding · complete_section_1.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "complete_section_1",
      description: "Persist communication preferences (the 'comms' section). Call once channel + handle are gathered.",
      parameters: {
        type: "object",
        properties: {
          messaging_channel: { type: "string", enum: ["telegram", "slack", "whatsapp"] },
          messaging_handle: { type: "string" },
          slack_workspace_url: { type: ["string", "null"] },
          slack_channel_name: { type: ["string", "null"] },
        },
        required: ["messaging_channel", "messaging_handle", "slack_workspace_url", "slack_channel_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_narrative_section",
      description: "Upsert answers for one narrative section. CALL ONLY AFTER the DEPTH GATE is met for every required field — i.e. concrete specifics (numbers, names, real steps), and a synthesize-and-check beat run with the client. Field-presence is NOT field-depth; do not call this just because you have words for each field. Include only fields the client actually provided; data merges server-side. The flow advances only when all REQUIRED fields are present.",
      parameters: {
        type: "object",
        properties: {
          section_id: { type: "string", enum: NARRATIVE_SECTIONS.map((s) => s.id) },
          data: { type: "object", additionalProperties: true },
        },
        required: ["section_id", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_repeatable_row",
      description: "Append ONE row to a repeatable section (a function deep-dive, a tool, a person, or an access item). CALL ONLY AFTER the DEPTH GATE is met for that row — concrete specifics, not labels. For function deep-dives especially, the row is the spine of the automation map: it must reflect the function's real operation (real steps, named tools, owner, hours/wk, volume, named bottleneck). Run the synthesize-and-check beat with the client before adding the row.",
      parameters: {
        type: "object",
        properties: {
          section_id: { type: "string", enum: REPEATABLE_SECTIONS.map((s) => s.id) },
          data: { type: "object", additionalProperties: true },
        },
        required: ["section_id", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_repeatable_section",
      description: "Signal a repeatable section is finished. CALL ONLY AFTER every row passes the DEPTH GATE (genuinely substantive — not just field-present). Validates the hard rule (e.g. every active function has a complete deep-dive). Returns an error listing what's missing if not yet complete. If field-presence passes but the rows are thin, you've failed the depth gate — keep enriching them before completing.",
      parameters: {
        type: "object",
        properties: { section_id: { type: "string", enum: REPEATABLE_SECTIONS.map((s) => s.id) } },
        required: ["section_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_uploader",
      description: "Render the inline file uploader. variant 'brand' = logos/guidelines; variant 'knowledge' = SOPs/scripts/recordings.",
      parameters: {
        type: "object",
        properties: { variant: { type: "string", enum: ["brand", "knowledge"] } },
        required: ["variant"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_uploader_section",
      description: "Call after the client finishes uploading (or has nothing). Advances past the uploader section.",
      parameters: {
        type: "object",
        properties: { variant: { type: "string", enum: ["brand", "knowledge"] } },
        required: ["variant"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirm_call_booking",
      description: "Record whether the client booked the kickoff call.",
      parameters: {
        type: "object",
        properties: {
          call_id: { type: "string", enum: SCHEDULE_CALLS.map((c) => c.id) },
          booked: { type: "boolean" },
          notes: { type: ["string", "null"] },
        },
        required: ["call_id", "booked", "notes"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_schedule_calls_section",
      description: "Call after the kickoff call has been handled.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_automation_map",
      description: "Generate (or regenerate) the client's Business Process & Automation Map from their operations data. The rendered markdown streams into the chat automatically — never repeat its content.",
      parameters: {
        type: "object",
        properties: { feedback: { type: ["string", "null"] } },
        required: ["feedback"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "approve_automation_map",
      description: "Call when the client approves the latest automation map.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_onboarding",
      description: "Mark the client fully onboarded. Call last.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "note_insight",
      description:
        "Surface a genuine, specific insight to the client LIVE as a highlighted card — an automation opportunity, a bottleneck worth fixing, or a high-leverage pattern you've spotted from what they've told you. This is how we give value back during the conversation. Use it sparingly (a handful of times across the whole session), only when the insight is real, specific, and tied to something they actually said. Calling it does NOT advance the flow — keep going afterward.",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string", description: "Short, punchy (≤10 words), e.g. 'Reporting is a prime first automation.'" },
          detail: { type: "string", description: "1–2 sentences referencing their specifics and the implication (time/$ saved, what we'd automate)." },
        },
        required: ["headline", "detail"],
        additionalProperties: false,
      },
    },
  },
];

type IncomingMessage = { role: "user" | "assistant"; content: string };

// ── helpers ──────────────────────────────────────────────────────────────────

function columnFor(sectionId: string): string | undefined {
  return SECTIONS.find((s) => s.id === sectionId)?.column;
}

/** Advance onboarding_step to just past the given section (forward-only). */
async function advancePast(userId: string, sectionId: string) {
  const next = stepIndex(sectionId) + 2; // 1-based index of the NEXT section
  await supabaseAdmin
    .from("clients")
    .update({ onboarding_step: next, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

// ── tool handlers ──────────────────────────────────────────────────────────--

async function completeSection1(
  userId: string,
  args: { messaging_channel: string; messaging_handle: string; slack_workspace_url: string | null; slack_channel_name: string | null }
) {
  const update: Record<string, any> = {
    messaging_channel: args.messaging_channel,
    messaging_handle: args.messaging_handle,
    onboarding_step: stepIndex("comms") + 2,
    updated_at: new Date().toISOString(),
  };
  if (args.slack_workspace_url) update.slack_workspace_url = args.slack_workspace_url;
  if (args.slack_channel_name) update.slack_channel_name = args.slack_channel_name;
  const { error } = await supabaseAdmin.from("clients").update(update).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function saveNarrativeSection(userId: string, args: { section_id: string; data: Record<string, any> }) {
  const column = columnFor(args.section_id);
  if (!column) return { ok: false, error: `Unknown section: ${args.section_id}` };

  const { data: existing } = await supabaseAdmin
    .from("brand_intakes")
    .select(column)
    .eq("client_id", userId)
    .maybeSingle();
  const existingData = (existing as Record<string, any> | null)?.[column] ?? {};
  const merged = { ...existingData, ...args.data };

  const { error } = await supabaseAdmin
    .from("brand_intakes")
    .upsert({ client_id: userId, [column]: merged }, { onConflict: "client_id" });
  if (error) return { ok: false, error: error.message };

  const missing = missingRequired(args.section_id, merged);
  if (missing.length === 0) await advancePast(userId, args.section_id);

  return { ok: true, merged, missing, advanced: missing.length === 0 };
}

function normalizeFunctionId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const lower = raw.toLowerCase().trim();
  const direct = BUSINESS_FUNCTIONS.find((f) => f.id === lower);
  if (direct) return direct.id;
  const labelMatch = BUSINESS_FUNCTIONS.find(
    (f) => f.label.toLowerCase() === lower || f.label.toLowerCase().startsWith(`${lower} `),
  );
  if (labelMatch) return labelMatch.id;
  const firstWord = lower.split(/[^a-z]/).filter(Boolean)[0];
  const fuzzy = BUSINESS_FUNCTIONS.find((f) => f.id === firstWord);
  return fuzzy?.id ?? null;
}

async function addRepeatableRow(userId: string, args: { section_id: string; data: Record<string, any> }) {
  const column = columnFor(args.section_id);
  if (!column) return { ok: false, error: `Unknown section: ${args.section_id}` };

  const data = { ...args.data };
  if (args.section_id === "functionDeepDives") {
    const norm = normalizeFunctionId(data.function_id);
    if (norm) data.function_id = norm;
  }

  const { data: existing } = await supabaseAdmin
    .from("brand_intakes")
    .select(column)
    .eq("client_id", userId)
    .maybeSingle();
  const arr: any[] = Array.isArray((existing as any)?.[column]) ? (existing as any)[column] : [];

  // Deep-dives are keyed by function_id — replace an existing row for the same function.
  let nextArr = [...arr, data];
  if (args.section_id === "functionDeepDives" && data.function_id) {
    nextArr = [...arr.filter((r) => normalizeFunctionId(r.function_id) !== data.function_id), data];
  }

  const { error } = await supabaseAdmin
    .from("brand_intakes")
    .upsert({ client_id: userId, [column]: nextArr }, { onConflict: "client_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: nextArr.length, merged: data };
}

async function completeRepeatableSection(userId: string, sectionId: string) {
  const column = columnFor(sectionId);
  const { data: intake } = await supabaseAdmin
    .from("brand_intakes")
    .select("*")
    .eq("client_id", userId)
    .maybeSingle();
  const rows: any[] = Array.isArray((intake as any)?.[column!]) ? (intake as any)[column!] : [];

  // Hard rules per repeatable section.
  if (sectionId === "functionDeepDives") {
    const active = ((intake as any)?.[INTAKE_COLUMNS.functionSelector]?.active_functions ?? []) as string[];
    const check = deepDivesComplete(active, rows);
    if (!check.complete) {
      return {
        ok: false,
        error: `Deep-dives not complete. Missing functions: ${check.missingFunctions.join(", ") || "none"}. Incomplete: ${check.incompleteRows.join("; ") || "none"}`,
      };
    }
  } else if (rows.length === 0) {
    return { ok: false, error: `Add at least one ${sectionId} row before completing this section.` };
  }

  await advancePast(userId, sectionId);
  return { ok: true, count: rows.length };
}

async function completeUploaderSection(userId: string, variant: "brand" | "knowledge") {
  await advancePast(userId, variant === "brand" ? "brandDocs" : "knowledgeAssets");
  return { ok: true };
}

async function confirmCallBooking(userId: string, args: { call_id: string; booked: boolean; notes: string | null }) {
  const call = SCHEDULE_CALLS.find((c) => c.id === args.call_id);
  if (!call) return { ok: false, error: `Unknown call_id: ${args.call_id}` };
  const { data: existing } = await supabaseAdmin
    .from("scheduled_calls")
    .select("id")
    .eq("client_id", userId)
    .eq("month", call.month)
    .eq("week", call.week)
    .limit(1)
    .maybeSingle();
  const payload = {
    client_id: userId,
    title: call.title,
    month: call.month,
    week: call.week,
    calendly_url: CALENDLY_BASE_URL,
    scheduled_at: args.booked ? Date.now() : null,
    notes: args.notes,
  };
  if (existing?.id) {
    const { error } = await supabaseAdmin.from("scheduled_calls").update(payload).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabaseAdmin.from("scheduled_calls").insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, merged: { call: call.title, booked: args.booked } };
}

async function completeScheduleCallsSection(userId: string) {
  await advancePast(userId, "scheduleCall");
  return { ok: true };
}

async function generateAutomationMap(
  userId: string,
  feedback: string | null,
  onChunk?: (delta: string) => void
): Promise<{ ok: true; content: string; version: number } | { ok: false; error: string }> {
  const { data: intake } = await supabaseAdmin
    .from("brand_intakes")
    .select("*")
    .eq("client_id", userId)
    .maybeSingle();
  if (!intake) return { ok: false, error: "No intake found." };

  const i = intake as Record<string, any>;

  if (!feedback) {
    const missing: string[] = [];
    const isEmptyObj = (v: any) => !v || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
    const isEmptyArr = (v: any) => !Array.isArray(v) || v.length === 0;
    if (isEmptyObj(i[INTAKE_COLUMNS.companySnapshot])) missing.push("companySnapshot");
    if (isEmptyObj(i[INTAKE_COLUMNS.functionSelector])) missing.push("functionSelector");
    if (isEmptyArr(i[INTAKE_COLUMNS.functionDeepDives])) missing.push("functionDeepDives");
    if (isEmptyArr(i[INTAKE_COLUMNS.toolStack])) missing.push("toolStack");
    if (isEmptyObj(i[INTAKE_COLUMNS.goals])) missing.push("goals");
    if (isEmptyArr(i[INTAKE_COLUMNS.people])) missing.push("people");
    if (isEmptyObj(i[INTAKE_COLUMNS.guardrails])) missing.push("guardrails");
    if (isEmptyObj(i[INTAKE_COLUMNS.market])) missing.push("market");
    if (isEmptyObj(i[INTAKE_COLUMNS.brandVoice])) missing.push("brandVoice");
    if (isEmptyArr(i[INTAKE_COLUMNS.accessInventory])) missing.push("accessInventory");
    if (missing.length > 0) {
      return {
        ok: false,
        error: `BLOCKED: cannot generate automation map. Missing sections: ${missing.join(", ")}. Go back to each missing section, run the depth gate, and persist via the appropriate tool (save_narrative_section or add_repeatable_row + complete_repeatable_section) before retrying generate_automation_map.`,
      };
    }
  }
  const fnLabel = (id: string) => BUSINESS_FUNCTIONS.find((f) => f.id === id)?.label ?? id;

  const opsBlock = `
COMPANY SNAPSHOT: ${JSON.stringify(i[INTAKE_COLUMNS.companySnapshot] ?? {})}
ACTIVE FUNCTIONS / TIME DRAINS: ${JSON.stringify(i[INTAKE_COLUMNS.functionSelector] ?? {})}
FUNCTION DEEP-DIVES (each = a candidate automation): ${JSON.stringify(i[INTAKE_COLUMNS.functionDeepDives] ?? [])}
TOOL STACK (Composio connection source): ${JSON.stringify(i[INTAKE_COLUMNS.toolStack] ?? [])}
GOALS & BOTTLENECKS: ${JSON.stringify(i[INTAKE_COLUMNS.goals] ?? {})}
PEOPLE / APPROVALS: ${JSON.stringify(i[INTAKE_COLUMNS.people] ?? [])}
GUARDRAILS: ${JSON.stringify(i[INTAKE_COLUMNS.guardrails] ?? {})}
MARKET / CUSTOMER: ${JSON.stringify(i[INTAKE_COLUMNS.market] ?? {})}
BRAND VOICE (supporting context only): ${JSON.stringify(i[INTAKE_COLUMNS.brandVoice] ?? {})}
INSIGHTS SPOTTED LIVE DURING DISCOVERY (incorporate these): ${JSON.stringify(i.additional_context?.insights ?? [])}
`;

  const feedbackBlock = feedback
    ? `\n\n## Client feedback to incorporate\n${feedback}\nRewrite taking this into account.`
    : "";

  const prompt = `You are a business-operations analyst producing a **Business Process & Automation Map** for an internal Rawgrowth team. The reader is the COO deciding what to automate via Composio. This is NOT a brand essay — it is an operations and automation plan. Be concrete and specific to THIS company's data.

Output markdown with these H2 sections:

## Operation at a glance
- One-liner, stage, headcount, the active functions.
- The full tool stack grouped by category (what data each holds, read/write intent).
- Top 3 business-wide bottlenecks and the stated goal / where they want to be.

## Business Process & Automation Map
A markdown table, ONE ROW PER PROCESS (from the function deep-dives), columns:
| Process | How it runs today | Owner · hrs/wk · volume | Tools it touches | Bottleneck / pain | Automation opportunity (what an agent would do + which named tools/Composio connectors it needs) | Read/Write scope | Autonomy (draft vs auto) |
RANK rows by leverage (hours/week × frequency × pain) — highest-value automations first. This ordering is the build sequence.

## Composio connection checklist
A bullet list of every tool referenced by any automation above, each tagged: must-have-v1 / later, and read / write / both.

## Asset readiness check
For each automation in the map, note whether the underlying assets (SOP / script / template / content library / example outputs) EXIST today. Three-tier:
- ✅ Ready — asset exists and is usable
- 🟡 Drafted / in-heads — partial; we can extract and formalise during install
- 🔴 Missing — needs to be built before the agent can run
Pull this from each deep-dive's existing_sop field. This tells us where the install hits the ground running vs. where we have authoring work first.

## 90-Day Action Roadmap
Three buckets, ordered by leverage × asset readiness. UNDERPROMISE — set a realistic journey, not an aspirational one. The right expectations on Day 1 prevent disappointment on Day 7.
- **Do First (Days 1–30):** the automations with highest leverage AND ✅ asset readiness — these ship fastest. Realistic launch window: 2–3 weeks per agent, not "by Friday."
- **Do Next (Days 31–60):** high-leverage automations that need 🟡 asset work first; or medium-leverage but ✅ ready.
- **Do Later (Days 61–90+):** lower-leverage or 🔴 missing-asset automations; sequenced for the second half of the install.
For each item: one line — what we're automating + the expected unlock (hours back, $ moved, capacity freed) + a candid launch window (not best-case).

## Brand voice appendix (brief)
2–3 lines on how automations should sound, from the brand voice data.

Function id → label map: ${BUSINESS_FUNCTIONS.map((f) => `${f.id}=${f.label}`).join("; ")}.${feedbackBlock}

## Operations data
${opsBlock}`;

  let content = "";
  try {
    const streamResp = await openai.chat.completions.create({
      model: LLM_MODEL,
      max_tokens: 4096,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    });
    for await (const chunk of streamResp) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        content += delta;
        onChunk?.(delta);
      }
    }
  } catch (err: any) {
    return { ok: false, error: err.message || "Map generation failed" };
  }
  if (!content.trim()) return { ok: false, error: "Generation returned no content." };

  const { data: latest } = await supabaseAdmin
    .from("brand_profiles")
    .select("version")
    .eq("client_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version ?? 0) + 1;

  const { error } = await supabaseAdmin.from("brand_profiles").insert({
    client_id: userId,
    version: nextVersion,
    content,
    status: "ready",
    generated_at: Date.now(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, content, version: nextVersion };
}

async function approveAutomationMap(userId: string) {
  const { data: latest } = await supabaseAdmin
    .from("brand_profiles")
    .select("id")
    .eq("client_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return { ok: false, error: "No automation map to approve." };
  const nowMs = Date.now();
  const { error: pErr } = await supabaseAdmin
    .from("brand_profiles")
    .update({ status: "approved", approved_at: nowMs, approved_by: userId })
    .eq("id", latest.id);
  if (pErr) return { ok: false, error: pErr.message };
  await advancePast(userId, "automationMap");
  return { ok: true };
}

async function completeOnboarding(userId: string, transcript: IncomingMessage[]) {
  const { error } = await supabaseAdmin
    .from("clients")
    .update({ onboarding_step: TOTAL_ONBOARDING_STEPS, status: "active", updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  const clean = transcript
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
  await supabaseAdmin
    .from("brand_intakes")
    .upsert({ client_id: userId, full_transcript: clean, submitted_at: Date.now() }, { onConflict: "client_id" });
  return { ok: true, transcript_turns: clean.length };
}

// Reciprocity: persist a live insight the consultant surfaced to the client.
// Stored in additional_context.insights[] (existing column from migration 005);
// feeds the Automation Map and gives value back during the conversation.
async function addInsight(userId: string, headline: string, detail: string) {
  const { data: existing } = await supabaseAdmin
    .from("brand_intakes")
    .select("additional_context")
    .eq("client_id", userId)
    .maybeSingle();
  const ctx = ((existing as any)?.additional_context ?? {}) as Record<string, any>;
  const insights = Array.isArray(ctx.insights) ? ctx.insights : [];
  insights.push({ headline, detail, at: Date.now() });
  const { error } = await supabaseAdmin
    .from("brand_intakes")
    .upsert({ client_id: userId, additional_context: { ...ctx, insights } }, { onConflict: "client_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── next-action computation (the guided, hard-gated flow) ────────────────────

function buildNextAction(
  client: any,
  intake: Record<string, any>,
  uploadCounts: { brand: number; knowledge: number },
  callBooked: boolean,
  latestProfile: any
): string {
  const step = client?.onboarding_step ?? 1;
  const current = SECTIONS[Math.min(step - 1, SECTIONS.length - 1)];
  const purpose = (s: typeof current) => `Section: "${s.label}". Purpose to open with: "${s.intro}"`;

  switch (current.id) {
    case "comms":
      return `${purpose(current)} Ask which channel (Telegram/Slack/WhatsApp), then their handle, then optionally a Slack workspace URL + channel. Then call complete_section_1. Do NOT ask anything else here.`;

    case "functionDeepDives": {
      const active = (intake[INTAKE_COLUMNS.functionSelector]?.active_functions ?? []) as string[];
      const rows = (intake[INTAKE_COLUMNS.functionDeepDives] ?? []) as any[];
      const check = deepDivesComplete(active, rows);
      const reqList = FUNCTION_DEEPDIVE_FIELDS.filter((f) => f.required).map((f) => f.key).join(", ");
      if (check.complete) {
        return `${purpose(current)} All active functions have complete deep-dives. Call complete_repeatable_section({section_id:"functionDeepDives"}).`;
      }
      const nextFn = check.missingFunctions[0];
      const fnLabel = BUSINESS_FUNCTIONS.find((f) => f.id === nextFn)?.label ?? nextFn;
      return `FOCUS NOW: "${current.label}" — the operational heart of the engagement. ${current.intro} Functions in play: ${active.map((a) => BUSINESS_FUNCTIONS.find((f) => f.id === a)?.label ?? a).join(", ")}. ${
        nextFn
          ? `Take the "${fnLabel}" function next. Map it like Porter's value chain — walk the work end to end: how it's triggered, each real step, who touches it, where it breaks down, the tools involved, the volume and the time it eats. Use 80/20 to spend your questions on the steps that drive most of the cost/time, and a quick 5-Whys wherever it breaks. Bridge from anything relevant they've already told you. Build a genuine picture (these fields anchor it: ${reqList}; function_id="${nextFn}"). BEFORE you add the row: run the DEPTH GATE — reflect 4–6 concrete bullets back (their numbers, real steps, named tools, owner, hrs/wk, volume, specific bottleneck), name what's still thin, and have them fill it. The row is the spine of the automation map — a thin row corrupts the map. Once it's real, capture it with add_repeatable_row({section_id:"functionDeepDives", data:{...}}). Probe as much as this function deserves before moving to the next.`
          : `Some functions are half-mapped: ${check.incompleteRows.join("; ")}. Probe the missing pieces, then add_repeatable_row again (same function_id) to enrich the picture.`
      } Map one function fully, then move to the next. Don't close this area until every active function is genuinely understood.`;
    }

    case "toolStack": {
      const rows = (intake[INTAKE_COLUMNS.toolStack] ?? []) as any[];
      const covered = new Set(rows.map((r) => r.category));
      const reqList = SYSTEM_FIELDS.filter((f) => f.required).map((f) => f.key).join(", ");
      const remaining = TOOL_CATEGORIES.filter((c) => !covered.has(c.id));
      if (remaining.length === 0 && rows.length > 0) {
        return `${purpose(current)} You've covered every tool category. Call complete_repeatable_section({section_id:"toolStack"}).`;
      }
      const nextCat = remaining[0];
      return `${purpose(current)} Walk the client through their tool categories ONE at a time. Next category: "${nextCat?.label}" (e.g. ${nextCat?.examples}). Ask what they use for it. For each tool capture: ${reqList} (category="${nextCat?.id}"), then add_repeatable_row({section_id:"toolStack", data:{...}}). If they don't use a category, still add a row with product:"none". Cover all ${TOOL_CATEGORIES.length} categories, then complete_repeatable_section.`;
    }

    case "people": {
      const rows = (intake[INTAKE_COLUMNS.people] ?? []) as any[];
      const reqList = PERSON_FIELDS.filter((f) => f.required).map((f) => f.key).join(", ");
      if (rows.length > 0) {
        return `${purpose(current)} ${rows.length} person(s) captured. Ask if there's anyone else the agents should know about; if not, call complete_repeatable_section({section_id:"people"}). For each person capture: ${reqList}.`;
      }
      return `${purpose(current)} Capture the key people one at a time. Per person: ${reqList}. add_repeatable_row({section_id:"people", data:{...}}). At least one is required (the founder). Then complete_repeatable_section.`;
    }

    case "accessInventory": {
      const rows = (intake[INTAKE_COLUMNS.accessInventory] ?? []) as any[];
      const systems = (intake[INTAKE_COLUMNS.toolStack] ?? []).filter((s: any) => s.product && s.product !== "none");
      if (rows.length > 0) {
        return `${purpose(current)} Access items captured. When done, call complete_repeatable_section({section_id:"accessInventory"}).`;
      }
      return `${purpose(current)} Reassure the client: they don't set anything up now — we're just confirming which tools to connect. Their stack from earlier: ${systems.map((s: any) => s.product).join(", ") || "(none listed)"}. For each tool they're happy to connect, add_repeatable_row({section_id:"accessInventory", data:{tool, connect:"now"|"later", notes}}). Then complete_repeatable_section.`;
    }

    case "brandDocs":
      if (uploadCounts.brand === 0) {
        return `${purpose(current)} Say one inviting sentence, then call show_uploader({variant:"brand"}). Don't describe the widget.`;
      }
      return `${purpose(current)} ${uploadCounts.brand} file(s) uploaded. When they say they're done, call complete_uploader_section({variant:"brand"}).`;

    case "knowledgeAssets":
      if (uploadCounts.knowledge === 0) {
        return `${purpose(current)} Say one inviting sentence, then call show_uploader({variant:"knowledge"}). Don't describe the widget.`;
      }
      return `${purpose(current)} ${uploadCounts.knowledge} file(s) uploaded. When they're done, call complete_uploader_section({variant:"knowledge"}).`;

    case "scheduleCall":
      if (!callBooked) {
        return `${purpose(current)} Share the kickoff link as a markdown link [Book Week 1 Kickoff](${CALENDLY_BASE_URL}) and ask them to book. When they confirm (or skip), call confirm_call_booking({call_id:"week1", booked:<bool>, notes:null}).`;
      }
      return `${purpose(current)} Call confirmed. Call complete_schedule_calls_section.`;

    case "automationMap":
      if (client?.status === "active") {
        return `Onboarding is fully complete. Respond warmly and briefly to anything further.`;
      }
      if (!latestProfile) {
        return `${purpose(current)} Tell them you're building their automation map now, then call generate_automation_map({feedback:null}).`;
      }
      if (latestProfile.status !== "approved") {
        return `${purpose(current)} The map (v${latestProfile.version}) is rendered. Ask them to reply "approve" or describe changes. If approved → approve_automation_map. If changes → generate_automation_map({feedback:"<their words>"}).`;
      }
      // Map approved but client not yet active → finish.
      return `${purpose(current)} The automation map is approved. Call complete_onboarding now, then write a short warm congratulations (3–4 sentences).`;

    default:
      if (client?.status !== "active") {
        return `All sections complete. Call complete_onboarding, then write a short warm congratulations (3–4 sentences).`;
      }
      return `Onboarding is fully complete. Respond warmly and briefly to anything further.`;
  }
}

// For narrative sections we need the missing-field detail; handled below.
function narrativeNextAction(current: any, intake: Record<string, any>): string {
  const column = current.column!;
  const data = (intake[column] ?? {}) as Record<string, any>;
  const missing = missingRequired(current.id, data);
  const fieldHelp = (current.fields ?? [])
    .map((f: any) => `${f.key}${f.required ? " (required)" : ""}${f.hint ? ` — ${f.hint}` : ""}`)
    .join("; ");
  const captured = Object.keys(data).length ? `You already have: ${JSON.stringify(data)} — don't re-ask these; build on them.` : "Nothing captured here yet.";

  // Framework cue for the areas where a named technique sharpens the discovery.
  const frameworkCue: Record<string, string> = {
    goals:
      " Run this like root-cause work: on each bottleneck use the 5 Whys to get past the symptom to the real constraint, and silently use an issue tree to make sure you've covered the MECE drivers. Apply the 'So what?' test — tie each constraint to what we'd automate.",
    guardrails:
      " Use RAPID (Bain) to pin down decision rights: who Recommends, Agrees, Performs, gives Input, and Decides on anything client-facing. That's how we set each agent's autonomy.",
    companySnapshot:
      " Anchor with SCQA — their Situation, the Complication driving them to us, the Question it raises.",
    market:
      " A quick hypothesis-led read here is fine ('I'd guess your sharpest segment is X — true?'), then refine against them.",
  };
  const cue = frameworkCue[current.id] ?? "";

  return `FOCUS NOW: "${current.label}". What you're trying to understand: ${current.intro} ${captured} The substance this area needs (capture into these fields): ${fieldHelp}. Still required before you can save & move on: ${missing.join(", ") || "(field-presence met — now check DEPTH before saving)"}. Interview them like a consultant: get concrete specifics, follow the threads that matter, connect to what they've already told you, and probe anything vague.${cue} BEFORE SAVING: run the DEPTH GATE — reflect 3–5 concrete bullets back (their numbers, names, real steps), name what's still thin in plain English, and ask them to fill those gaps. Save ONLY when each required field is a concrete specific (number, name, real step), not a label or generality. Then call save_narrative_section({section_id:"${current.id}", data:{...}}).`;
}

// A compact running digest of what's been captured so far, so the consultant
// can reference earlier answers, connect threads, and never re-ask.
function buildKnowledgeDigest(intake: Record<string, any>): string {
  const trunc = (v: any, n = 140) => {
    if (v == null) return "";
    const s = Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.length > n ? s.slice(0, n) + "…" : s;
  };
  const lines: string[] = [];

  const snap = intake[INTAKE_COLUMNS.companySnapshot] as Record<string, any> | undefined;
  if (snap?.one_liner || snap?.what_you_sell) {
    lines.push(`• Company: ${trunc(snap.one_liner || snap.what_you_sell)}${snap.scale ? ` | scale: ${trunc(snap.scale, 60)}` : ""}`);
  }
  const scope = intake[INTAKE_COLUMNS.functionSelector] as Record<string, any> | undefined;
  if (scope?.active_functions?.length) {
    const labels = (scope.active_functions as string[]).map((a) => BUSINESS_FUNCTIONS.find((f) => f.id === a)?.label?.split(" (")[0] ?? a);
    lines.push(`• Functions in play: ${labels.join(", ")}${scope.time_drains ? ` | biggest time drains: ${trunc(scope.time_drains, 80)}` : ""}`);
  }
  const dives = (intake[INTAKE_COLUMNS.functionDeepDives] ?? []) as any[];
  if (dives.length) {
    lines.push(`• Deep-dived so far: ${dives.map((d) => BUSINESS_FUNCTIONS.find((f) => f.id === d.function_id)?.label?.split(" (")[0] ?? d.function_id).join(", ")}`);
  }
  const tools = ((intake[INTAKE_COLUMNS.toolStack] ?? []) as any[]).filter((t) => t.product && t.product !== "none");
  if (tools.length) lines.push(`• Tools: ${trunc(tools.map((t) => t.product).join(", "), 180)}`);
  const goals = intake[INTAKE_COLUMNS.goals] as Record<string, any> | undefined;
  if (goals?.goal_90d || goals?.top_bottlenecks) {
    lines.push(`• Goal: ${trunc(goals.goal_90d, 80)}${goals.top_bottlenecks ? ` | bottlenecks: ${trunc(goals.top_bottlenecks, 100)}` : ""}`);
  }
  const market = intake[INTAKE_COLUMNS.market] as Record<string, any> | undefined;
  if (market?.icp_segments) lines.push(`• ICP: ${trunc(market.icp_segments, 120)}`);
  const people = (intake[INTAKE_COLUMNS.people] ?? []) as any[];
  if (people.length) lines.push(`• People: ${people.map((p) => `${p.name}${p.role ? ` (${p.role})` : ""}`).join(", ")}`);
  const guard = intake[INTAKE_COLUMNS.guardrails] as Record<string, any> | undefined;
  if (guard?.autonomy_default) lines.push(`• Autonomy default: ${trunc(guard.autonomy_default, 60)}`);

  return lines.length ? lines.join("\n") : "(nothing captured yet — this is the start of the engagement)";
}

// ── route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!LLM_KEY_PRESENT)
      return NextResponse.json({ error: "No LLM API key configured (OPENAI_API_KEY or OPENROUTER_API_KEY)" }, { status: 500 });

    const { messages: incoming } = (await req.json()) as { messages: IncomingMessage[] };

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("name, email, company, messaging_channel, messaging_handle, onboarding_step, status")
      .eq("id", user.id)
      .maybeSingle();

    const { data: intakeRow } = await supabaseAdmin
      .from("brand_intakes")
      .select("*")
      .eq("client_id", user.id)
      .maybeSingle();
    const intake = (intakeRow ?? {}) as Record<string, any>;

    const { data: latestProfile } = await supabaseAdmin
      .from("brand_profiles")
      .select("id, version, status")
      .eq("client_id", user.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: docs } = await supabaseAdmin
      .from("documents")
      .select("type")
      .eq("client_id", user.id);
    const brandTypes = new Set(["logo", "guideline", "asset"]);
    const knowledgeTypes = new Set(["sop", "script", "recording"]);
    const uploadCounts = {
      brand: (docs ?? []).filter((d) => brandTypes.has(d.type)).length,
      knowledge: (docs ?? []).filter((d) => knowledgeTypes.has(d.type)).length,
    };

    const { data: callRows } = await supabaseAdmin
      .from("scheduled_calls")
      .select("scheduled_at")
      .eq("client_id", user.id);
    const callBooked = (callRows ?? []).some((r) => r.scheduled_at);

    const step = client?.onboarding_step ?? 1;
    const current = SECTIONS[Math.min(step - 1, SECTIONS.length - 1)];

    const nextActionBlock =
      current?.kind === "narrative"
        ? narrativeNextAction(current, intake)
        : buildNextAction(client, intake, uploadCounts, callBooked, latestProfile);

    const knownLines: string[] = [];
    if (client?.name) knownLines.push(`- full name: ${JSON.stringify(client.name)}`);
    if (client?.company) knownLines.push(`- company: ${JSON.stringify(client.company)}`);
    if (client?.email) knownLines.push(`- email: ${JSON.stringify(client.email)}`);

    // Surface the Wispr nudge once, on the very first turn of the conversation.
    const isFirstTurn = incoming.filter((m) => m.role === "user").length <= 1;
    const wisprBlock = isFirstTurn ? `\n\nON YOUR FIRST REPLY ONLY: include this line verbatim near the top — ${WISPR_FLOW_NUDGE}` : "";

    const digest = buildKnowledgeDigest(intake);

    const contextPrompt = `\n\n------------------------------------------------------------\nWHAT WE'VE LEARNED SO FAR (build on this — reference it, connect threads, never re-ask)\n------------------------------------------------------------\n${digest}\n\nClient on file: ${knownLines.join(" · ") || "(nothing yet)"}\n\n------------------------------------------------------------\nYOUR FOCUS NOW (your objective for this stretch — not a script)\n------------------------------------------------------------\n${nextActionBlock}${wisprBlock}\n`;

    const safeIncoming = incoming.filter(
      (m): m is IncomingMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof (m as any).content === "string" && (m as any).content.trim().length > 0
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + contextPrompt },
      ...safeIncoming.map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam),
    ];

    const lastUserMsg = safeIncoming.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
    const SAVE_TRIGGER_RE = /\b(save|next(?:\s+section)?|move\s+on|proceed|approved?|looks?\s+good|ship\s+it|manda|salva|let'?s\s+move\s+on|we\s+can\s+move\s+on|done|that'?s\s+all|finalize|go\s+ahead)\b/i;
    const saveSignaled = SAVE_TRIGGER_RE.test(lastUserMsg);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: Record<string, any>) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        try {
          for (let iter = 0; iter < 6; iter++) {
            const forceTool = iter === 0 && saveSignaled && current && current.kind !== "logistics";
            const completion = await openai.chat.completions.create({
              model: LLM_MODEL,
              stream: true,
              temperature: 0.3,
              messages,
              tools: TOOLS,
              tool_choice: forceTool ? "required" : "auto",
            });

            let textContent = "";
            const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
            let finishReason: string | null = null;

            for await (const chunk of completion) {
              const choice = chunk.choices[0];
              const delta = choice?.delta;
              if (delta?.content) {
                textContent += delta.content;
                emit({ type: "text", delta: delta.content });
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { id: "", name: "", arguments: "" };
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
                }
              }
              if (choice?.finish_reason) finishReason = choice.finish_reason;
            }

            if (finishReason !== "tool_calls" || toolCalls.length === 0) break;

            messages.push({
              role: "assistant",
              content: textContent || null,
              tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: tc.arguments } })),
            });

            for (const tc of toolCalls) {
              let result: any;
              let label: string | null = null;
              let parsed: any = {};
              try {
                parsed = JSON.parse(tc.arguments || "{}");
              } catch {}

              const reasoningId = (globalThis.crypto?.randomUUID?.() as string) || `r_${Date.now()}_${Math.random()}`;
              const sectionLabel = (id: string) => SECTIONS.find((s) => s.id === id)?.label ?? id;
              let reasoningLabel = "Saving";
              if (tc.name === "save_narrative_section") reasoningLabel = `Saving ${sectionLabel(parsed.section_id).toLowerCase()}`;
              else if (tc.name === "add_repeatable_row") reasoningLabel = `Saving a ${sectionLabel(parsed.section_id).toLowerCase()} entry`;
              else if (tc.name === "complete_repeatable_section") reasoningLabel = `Locking in ${sectionLabel(parsed.section_id).toLowerCase()}`;
              else if (tc.name === "complete_section_1") reasoningLabel = "Saving your contact preferences";
              else if (tc.name === "generate_automation_map") reasoningLabel = "Building your automation map";
              else if (tc.name === "approve_automation_map") reasoningLabel = "Approving your automation map";
              else if (tc.name === "show_uploader") reasoningLabel = "Opening the upload panel";
              else if (tc.name === "complete_uploader_section") reasoningLabel = "Locking in your files";
              else if (tc.name === "confirm_call_booking") reasoningLabel = "Logging your kickoff call";
              else if (tc.name === "complete_onboarding") reasoningLabel = "Finalising your onboarding";
              // note_insight renders its own card — no reasoning bubble / progress for it.
              if (tc.name !== "note_insight") {
                emit({ type: "reasoning", status: "thinking", id: reasoningId, label: reasoningLabel });
              }

              try {
                if (tc.name === "complete_section_1") {
                  result = await completeSection1(user.id, parsed);
                  label = "Contact preferences";
                } else if (tc.name === "save_narrative_section") {
                  result = await saveNarrativeSection(user.id, parsed);
                  label = sectionLabel(parsed.section_id);
                  if (result.ok && !result.advanced) {
                    result = { ...result, note: `Saved, but these REQUIRED fields are still missing: ${result.missing.join(", ")}. Ask for exactly those, then save again. Do NOT move on.` };
                  }
                } else if (tc.name === "add_repeatable_row") {
                  result = await addRepeatableRow(user.id, parsed);
                  label = sectionLabel(parsed.section_id);
                } else if (tc.name === "complete_repeatable_section") {
                  result = await completeRepeatableSection(user.id, parsed.section_id);
                  label = sectionLabel(parsed.section_id);
                } else if (tc.name === "show_uploader") {
                  emit({ type: "uploader", variant: parsed.variant });
                  result = { ok: true, note: "Uploader rendered. Wait for the client's next message." };
                  label = parsed.variant === "brand" ? "Brand uploader" : "Knowledge uploader";
                } else if (tc.name === "complete_uploader_section") {
                  result = await completeUploaderSection(user.id, parsed.variant);
                  label = "Files locked in";
                } else if (tc.name === "confirm_call_booking") {
                  result = await confirmCallBooking(user.id, parsed);
                  label = "Kickoff call";
                } else if (tc.name === "complete_schedule_calls_section") {
                  result = await completeScheduleCallsSection(user.id);
                  label = "Kickoff scheduled";
                } else if (tc.name === "generate_automation_map") {
                  emit({ type: "text", delta: parsed.feedback ? "\n\nRegenerating your map with that feedback — one moment.\n\n" : "\n\nBuilding your Business Process & Automation Map now — this takes 20–30 seconds.\n\n" });
                  const gen = await generateAutomationMap(user.id, parsed.feedback ?? null, (delta) => emit({ type: "text", delta }));
                  if (gen.ok) {
                    emit({ type: "text", delta: "\n\n" });
                    result = { ok: true, note: "Map rendered. Do NOT repeat it. Ask the client to reply 'approve' or describe changes." };
                    label = `Automation map v${gen.version}`;
                  } else {
                    emit({ type: "error", message: gen.error });
                    result = { ok: false, error: gen.error };
                  }
                } else if (tc.name === "approve_automation_map") {
                  result = await approveAutomationMap(user.id);
                  label = "Automation map approved";
                } else if (tc.name === "complete_onboarding") {
                  result = await completeOnboarding(user.id, incoming);
                  label = "Onboarding complete";
                  if (result.ok) {
                    emit({ type: "celebrate" });
                    emit({ type: "portal_button" });
                    result = { ok: true, note: "Write ONE short congratulatory sentence. The portal button is already shown — don't describe it." };
                  }
                } else if (tc.name === "note_insight") {
                  emit({ type: "insight", headline: parsed.headline, detail: parsed.detail });
                  result = await addInsight(user.id, parsed.headline ?? "", parsed.detail ?? "");
                  result = { ...result, note: "Insight shown to the client as a card. Keep going with the conversation — do not repeat the insight in your next message." };
                } else {
                  result = { ok: false, error: `Unknown tool: ${tc.name}` };
                }
              } catch (err: any) {
                result = { ok: false, error: err.message };
              }

              messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });

              // note_insight has its own card — skip the reasoning-done + progress chrome.
              if (tc.name === "note_insight") continue;

              if (result?.ok) {
                const fields = tc.name === "save_narrative_section" || tc.name === "add_repeatable_row" ? result.merged : undefined;
                emit({ type: "reasoning", status: "done", id: reasoningId, label: reasoningLabel.replace(/^Saving/, "Saved").replace(/^Building/, "Built").replace(/^Locking in/, "Locked in").replace(/^Opening/, "Opened").replace(/^Logging/, "Logged").replace(/^Approving/, "Approved").replace(/^Finalising/, "Finalised"), fields });
                const progress = await computeOnboardingProgress(user.id);
                emit({ type: "progress", current: progress.current, total: progress.total, completed: progress.completed, label });
              } else {
                emit({ type: "reasoning", status: "error", id: reasoningId, label: reasoningLabel, error: result?.error });
              }
            }
          }
          controller.close();
        } catch (err: any) {
          try {
            emit({ type: "error", message: err.message || "Stream error" });
          } catch {}
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
