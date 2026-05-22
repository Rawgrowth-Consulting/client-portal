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
const LLM_MODEL = USE_OPENROUTER ? "openai/gpt-4o" : "gpt-4o";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  ...(USE_OPENROUTER ? { baseURL: "https://openrouter.ai/api/v1" } : {}),
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

const SYSTEM_PROMPT = `You are the Rawgrowth onboarding guide. Your job is to map the client's ENTIRE business operation — how they work, every process, their full tool stack, their bottlenecks, and where they want to be — so we know exactly what to automate for them.

TONE: warm, plain-spoken, encouraging. No jargon. One focused question per turn. Acknowledge each answer in a short clause ("Got it.") then ask the next thing. Never use long bullet lists in your questions.

GUIDED FLOW — you are a guide, not a form. For each section:
- Open with ONE plain sentence on what this section is for and why it helps (use the section's purpose line from the NEXT ACTION block).
- Ask the questions conversationally, grouping 1–3 closely-related fields per turn.
- Tell the client when they can give as much or as little detail as they like, but push gently for specifics on the operational sections — that detail is what gets automated.

HARD COMPLETION RULES — you may NOT skip ahead:
- Every section lists REQUIRED fields. You must capture all of them before the section's save/complete tool will advance the flow.
- If a save tool returns "missing" fields, you have NOT finished — ask for exactly those fields, then save again. Do not move on.
- Never invent answers. If a client is unsure, help them think it through; don't fabricate.

NEVER repeat a question already answered in this conversation. Scan history first.
NEVER announce section transitions ("moving on", "next section", "let's talk about…"). Just acknowledge, then ask the next question directly.

PERSISTENCE — you MUST call the provided tools to save data. Saving is the only way the flow advances:
- Narrative sections → \`save_narrative_section({section_id, data})\` (only the fields you captured; merged server-side).
- Repeatable sections (one row at a time) → \`add_repeatable_row({section_id, data})\`, then \`complete_repeatable_section({section_id})\` when the section's rule is met.
- Brand assets / knowledge files → \`show_uploader\` then \`complete_uploader_section\`.
- Kickoff call → \`confirm_call_booking\` then \`complete_schedule_calls_section\`.
- Automation map → \`generate_automation_map\`, then \`approve_automation_map\` after the client approves.
- Finish → \`complete_onboarding\`.

The NEXT ACTION block below tells you exactly which section you're in, its purpose, what's required, and what's still missing. Follow it precisely. Do everything it says, nothing it forbids.`;

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
      description: "Upsert answers for one narrative section. Include only fields the client actually provided; data merges server-side. The flow advances only when all REQUIRED fields are present.",
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
      description: "Append ONE row to a repeatable section (a function deep-dive, a tool, a person, or an access item). Call once per row as you capture it.",
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
      description: "Signal a repeatable section is finished. Validates the hard rule (e.g. every active function has a complete deep-dive). Returns an error listing what's missing if not yet complete.",
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

async function addRepeatableRow(userId: string, args: { section_id: string; data: Record<string, any> }) {
  const column = columnFor(args.section_id);
  if (!column) return { ok: false, error: `Unknown section: ${args.section_id}` };

  const { data: existing } = await supabaseAdmin
    .from("brand_intakes")
    .select(column)
    .eq("client_id", userId)
    .maybeSingle();
  const arr: any[] = Array.isArray((existing as any)?.[column]) ? (existing as any)[column] : [];

  // Deep-dives are keyed by function_id — replace an existing row for the same function.
  let nextArr = [...arr, args.data];
  if (args.section_id === "functionDeepDives" && args.data.function_id) {
    nextArr = [...arr.filter((r) => r.function_id !== args.data.function_id), args.data];
  }

  const { error } = await supabaseAdmin
    .from("brand_intakes")
    .upsert({ client_id: userId, [column]: nextArr }, { onConflict: "client_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: nextArr.length, merged: args.data };
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
      return `${purpose(current)} Active functions: ${active.map((a) => BUSINESS_FUNCTIONS.find((f) => f.id === a)?.label ?? a).join(", ")}. ${
        nextFn
          ? `Next, deep-dive the "${fnLabel}" function. Capture these REQUIRED fields conversationally: ${reqList}. (function_id must be "${nextFn}".) When you have them, call add_repeatable_row({section_id:"functionDeepDives", data:{...}}).`
          : `Some rows are incomplete: ${check.incompleteRows.join("; ")}. Re-ask the missing fields and add_repeatable_row again (same function_id) to overwrite.`
      } Do one function fully, then the next. Don't complete the section until all are done.`;
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
  const captured = Object.keys(data).length ? `Already captured: ${JSON.stringify(data)}. Do NOT re-ask these.` : "Nothing captured yet.";
  return `Section: "${current.label}". Purpose to open with: "${current.intro}" ${captured} Fields: ${fieldHelp}. Still REQUIRED before advancing: ${missing.join(", ") || "(none — you may save now)"}. Group 1–3 fields per turn, then call save_narrative_section({section_id:"${current.id}", data:{...new fields...}}). The flow advances only when all required fields are saved.`;
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

    const contextPrompt = `\n\n------------------------------------------------------------\nALREADY KNOWN — do NOT ask again\n------------------------------------------------------------\n${
      knownLines.join("\n") || "(nothing yet)"
    }\n\n------------------------------------------------------------\nNEXT ACTION — follow exactly\n------------------------------------------------------------\n${nextActionBlock}${wisprBlock}\n`;

    const safeIncoming = incoming.filter(
      (m): m is IncomingMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof (m as any).content === "string" && (m as any).content.trim().length > 0
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + contextPrompt },
      ...safeIncoming.map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: Record<string, any>) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        try {
          for (let iter = 0; iter < 6; iter++) {
            const completion = await openai.chat.completions.create({
              model: LLM_MODEL,
              stream: true,
              temperature: 0.3,
              messages,
              tools: TOOLS,
              tool_choice: "auto",
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
              emit({ type: "reasoning", status: "thinking", id: reasoningId, label: reasoningLabel });

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
                } else {
                  result = { ok: false, error: `Unknown tool: ${tc.name}` };
                }
              } catch (err: any) {
                result = { ok: false, error: err.message };
              }

              messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });

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
