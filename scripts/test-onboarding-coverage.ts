/**
 * Onboarding business-context coverage test.
 *
 * Verifies two things about the operations-first onboarding WITHOUT needing a
 * live DB/LLM:
 *   1. COVERAGE  — the 7 things an agent needs to do a company's work
 *      (WHO · WHAT · WITH-WHAT · FOR-WHOM · GUARDRAILS · WHY · LEARNING-FROM)
 *      are each captured by at least one required field/section, MECE-style.
 *   2. GATING    — a fully-populated client profile passes every hard rule,
 *      and realistically-incomplete profiles are BLOCKED at the right section.
 *
 * Run: npx tsx scripts/test-onboarding-coverage.ts   (placeholder env is fine)
 */
import {
  SECTIONS,
  INTAKE_COLUMNS,
  BUSINESS_FUNCTIONS,
  TOOL_CATEGORIES,
  FUNCTION_DEEPDIVE_FIELDS,
  SYSTEM_FIELDS,
  REQUIRED_FIELDS,
  missingRequired,
  deepDivesComplete,
} from "../src/lib/onboarding";

// Keys = physical brand_intakes columns the new model maps onto.
const C = INTAKE_COLUMNS;

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const hr = (t: string) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 56 - t.length))}`);

// ────────────────────────────────────────────────────────────────────────────
// A realistic, COMPLETE Company Operating Profile for a $6M consulting agency.
// ────────────────────────────────────────────────────────────────────────────
const ACTIVE_FUNCTIONS = ["marketing", "sales", "delivery", "operations", "finance"];

const completeIntake: Record<string, any> = {
  [C.companySnapshot]: {
    what_you_sell: "Done-for-you paid ads management; $4k/mo retainer + setup fee",
    business_model: "Monthly retainers (85%) + one-off audits (15%)",
    scale: "$6M/yr, 28 staff, operating 6 years",
    one_liner: "We help e-commerce brands scale profitably with paid ads",
  },
  [C.functionSelector]: {
    active_functions: ACTIVE_FUNCTIONS,
    time_drains: "delivery (reporting), sales (proposals), finance (invoicing)",
  },
  [C.functionDeepDives]: ACTIVE_FUNCTIONS.map((fn) => ({
    function_id: fn,
    workflow: `Trigger → steps → output for ${fn}`,
    owner: "Function lead",
    hours_per_week: "10h/wk, weekly, ~20 items",
    outputs: "Reports / proposals / posts",
    tools_touched: "ClickUp, Slack, Google Drive",
    recipient: "Client + account manager approves",
    pain: "Highly repetitive copy-paste and formatting",
    quality_bar: "On-brand, accurate, on time",
    existing_sop: "Drive link",
  })),
  [C.toolStack]: TOOL_CATEGORIES.map((c, idx) => ({
    category: c.id,
    product: idx === TOOL_CATEGORIES.length - 1 ? "none" : `${c.label} tool`,
    admin: "Ops manager",
    data_held: "Relevant business data",
    access_intent: "both",
    priority: idx < 3 ? "must-have for v1" : "later",
  })),
  [C.goals]: {
    goal_90d: "Cut delivery hours 30%",
    vision_12mo: "Scale to $10M without doubling headcount",
    top_bottlenecks: "Reporting time; proposal turnaround; manual invoicing",
    ten_hours_back: "Reporting automation",
    tried_failed: "Hired VAs, inconsistent quality",
  },
  [C.people]: [
    { name: "Founder", role: "CEO", functions: "leadership", decision_maker: "yes" },
    { name: "Ops lead", role: "COO", functions: "operations,finance", decision_maker: "yes" },
  ],
  [C.guardrails]: {
    autonomy_default: "Draft for approval",
    no_gos: "No guaranteed-ROI claims",
    data_sensitivity: "Never share client ad-account credentials externally",
    escalation: "Stop and ask before anything client-facing goes out",
  },
  [C.market]: {
    icp_segments: "DTC e-com brands $1–10M; pain: unprofitable ad spend; dream: profitable scale",
    objections: "We've been burned by agencies before",
    competitors: "Generic agencies; we differ on profit-first reporting",
    positioning: "Profit-first paid ads",
  },
  [C.brandVoice]: {
    voice_description: "Direct, data-driven, no fluff",
    never_say: "'Crush it', 'guru'",
    signature_phrases: "Profit over vanity metrics",
    messaging_pillars: "Transparency, profit focus",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// 1. COVERAGE — the 7 agent-needs each map to a captured, required field.
// ────────────────────────────────────────────────────────────────────────────
hr("COVERAGE: the 7 things an agent needs are captured");

const ddKeys = FUNCTION_DEEPDIVE_FIELDS.map((f) => f.key);
const needsMap: Record<string, boolean> = {
  "WHO (identity/voice/market)":
    REQUIRED_FIELDS.companySnapshot?.length > 0 &&
    REQUIRED_FIELDS.market?.includes("icp_segments") &&
    REQUIRED_FIELDS.brandVoice?.includes("voice_description"),
  "WHAT (the workflow + output)":
    ddKeys.includes("workflow") && ddKeys.includes("outputs"),
  "WITH-WHAT (tools/data → Composio)":
    !!SECTIONS.find((s) => s.id === "toolStack") &&
    SYSTEM_FIELDS.some((f) => f.key === "product" && f.required) &&
    ddKeys.includes("tools_touched"),
  "FOR-WHOM (recipient + people + ICP)":
    ddKeys.includes("recipient") &&
    !!SECTIONS.find((s) => s.id === "people") &&
    REQUIRED_FIELDS.market?.includes("icp_segments"),
  "GUARDRAILS (autonomy/no-gos/escalation)":
    REQUIRED_FIELDS.guardrails?.includes("autonomy_default") &&
    REQUIRED_FIELDS.guardrails?.includes("no_gos") &&
    REQUIRED_FIELDS.guardrails?.includes("escalation"),
  "WHY (goal + bottleneck/pain)":
    REQUIRED_FIELDS.goals?.includes("top_bottlenecks") && ddKeys.includes("pain"),
  "LEARNING-FROM (SOPs/knowledge)":
    ddKeys.includes("existing_sop") &&
    !!SECTIONS.find((s) => s.id === "knowledgeAssets"),
};
for (const [need, ok] of Object.entries(needsMap)) {
  check(`captured: ${need}`, !!ok);
}

hr("COVERAGE: MECE catalogs are exhaustive");
check("9 business functions present", BUSINESS_FUNCTIONS.length === 9, `${BUSINESS_FUNCTIONS.length}`);
check(
  "tool categories cover full stack (≥10, incl. industry-specific)",
  TOOL_CATEGORIES.length >= 10 && TOOL_CATEGORIES.some((c) => c.id === "industry"),
  `${TOOL_CATEGORIES.length}`
);
check(
  "every narrative section has ≥1 required field (no empty section)",
  SECTIONS.filter((s) => s.kind === "narrative").every((s) => (REQUIRED_FIELDS[s.id] ?? []).length > 0)
);
check(
  "deep-dive captures trigger→output→tools→recipient→pain",
  ["workflow", "outputs", "tools_touched", "recipient", "pain"].every((k) => ddKeys.includes(k))
);

// ────────────────────────────────────────────────────────────────────────────
// 2. GATING — complete profile passes; incomplete profiles are blocked.
// ────────────────────────────────────────────────────────────────────────────
hr("GATING: a COMPLETE profile passes every hard rule");

for (const s of SECTIONS.filter((x) => x.kind === "narrative")) {
  const miss = missingRequired(s.id, completeIntake[s.column!]);
  check(`narrative "${s.label}" complete → no missing required`, miss.length === 0, miss.join(", "));
}
const ddFull = deepDivesComplete(ACTIVE_FUNCTIONS, completeIntake[C.functionDeepDives]);
check("all active functions have complete deep-dives", ddFull.complete, JSON.stringify(ddFull));

hr("GATING: realistically-INCOMPLETE profiles are BLOCKED");

// (a) Missing a required guardrail (escalation)
const noEscalation = { ...completeIntake[C.guardrails] };
delete noEscalation.escalation;
const gMiss = missingRequired("guardrails", noEscalation);
check("guardrails missing 'escalation' → blocked", gMiss.includes("escalation"), gMiss.join(", "));

// (b) Active function with NO deep-dive row → flow can't pass
const ddMissingFn = deepDivesComplete(ACTIVE_FUNCTIONS, completeIntake[C.functionDeepDives].slice(0, 4)); // drop 'finance'
check(
  "active function without a deep-dive → blocked + named",
  !ddMissingFn.complete && ddMissingFn.missingFunctions.includes("finance"),
  JSON.stringify(ddMissingFn.missingFunctions)
);

// (c) Deep-dive row missing a required field (tools_touched) → blocked + named
const rowsBadField = completeIntake[C.functionDeepDives].map((r: any, i: number) =>
  i === 0 ? { ...r, tools_touched: "" } : r
);
const ddBadField = deepDivesComplete(ACTIVE_FUNCTIONS, rowsBadField);
check(
  "deep-dive row missing 'tools_touched' → blocked + named",
  !ddBadField.complete && ddBadField.incompleteRows.some((r) => r.includes("tools_touched")),
  JSON.stringify(ddBadField.incompleteRows)
);

// (d) Empty company snapshot → blocked on all 4 required fields
const emptySnap = missingRequired("companySnapshot", {});
check(
  "empty company snapshot → all 4 required missing",
  emptySnap.length === REQUIRED_FIELDS.companySnapshot.length && emptySnap.length === 4,
  emptySnap.join(", ")
);

// (e) Whitespace-only answer counts as missing (not a real answer)
const whitespace = missingRequired("goals", { ...completeIntake[C.goals], top_bottlenecks: "   " });
check("whitespace-only answer treated as missing", whitespace.includes("top_bottlenecks"));

// ────────────────────────────────────────────────────────────────────────────
// Coverage report
// ────────────────────────────────────────────────────────────────────────────
hr("FLOW MAP (order + required field count)");
SECTIONS.forEach((s, i) => {
  const req = s.kind === "narrative" ? `${(REQUIRED_FIELDS[s.id] ?? []).length} required` : s.kind;
  console.log(`  ${String(i + 1).padStart(2)}. ${s.label.padEnd(28)} [${s.pillar}] ${req}`);
});

hr("RESULT");
console.log(`  ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\n  FAILURES:");
  failures.forEach((f) => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log("  ✅ Onboarding captures full business context and gates on completeness.");
}
