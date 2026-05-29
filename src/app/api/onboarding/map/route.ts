import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { INTAKE_COLUMNS, BUSINESS_FUNCTIONS } from "@/lib/onboarding";

/**
 * Returns a structured "live operating map" of the client's business derived
 * from their current intake. Powers the live diagram in the onboarding panel.
 * No diagram layout here — just the semantic shape; the client renders it.
 */
export const dynamic = "force-dynamic";

type MapPayload = {
  company: { name?: string | null; one_liner?: string; scale?: string };
  market: { icp?: string };
  functions: Array<{
    id: string;
    label: string;
    active: boolean;
    deepDived: boolean;
    owner?: string;
    hours?: string;
    bottleneck?: string;
  }>;
  tools: Array<{ product: string; category?: string; functions: string[] }>;
  goal?: string;
  topBottlenecks?: string;
  insights: Array<{ headline: string; detail?: string }>;
  completeness: { totalActive: number; deepDived: number; toolsCaptured: number };
};

const trim = (v: any, n = 80) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length === 0 ? undefined : s.length > n ? s.slice(0, n) + "…" : s;
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: client }, { data: intakeRow }] = await Promise.all([
    supabaseAdmin.from("clients").select("name, company").eq("id", user.id).maybeSingle(),
    supabaseAdmin.from("brand_intakes").select("*").eq("client_id", user.id).maybeSingle(),
  ]);

  const intake = (intakeRow ?? {}) as Record<string, any>;
  const snap = (intake[INTAKE_COLUMNS.companySnapshot] ?? {}) as Record<string, any>;
  const scope = (intake[INTAKE_COLUMNS.functionSelector] ?? {}) as Record<string, any>;
  const dives = (intake[INTAKE_COLUMNS.functionDeepDives] ?? []) as any[];
  const toolsRaw = (intake[INTAKE_COLUMNS.toolStack] ?? []) as any[];
  const goals = (intake[INTAKE_COLUMNS.goals] ?? {}) as Record<string, any>;
  const market = (intake[INTAKE_COLUMNS.market] ?? {}) as Record<string, any>;
  const insights = ((intake.additional_context?.insights ?? []) as any[]).map((x) => ({
    headline: String(x.headline ?? ""),
    detail: x.detail ? String(x.detail) : undefined,
  }));

  const activeIds = (scope.active_functions ?? []) as string[];
  const diveById = new Map(dives.map((d) => [d.function_id, d]));

  // Functions: include any active OR deep-dived function (defensive).
  const functionIds = Array.from(new Set([...activeIds, ...dives.map((d) => d.function_id).filter(Boolean)]));
  const functions: MapPayload["functions"] = functionIds.map((id) => {
    const meta = BUSINESS_FUNCTIONS.find((f) => f.id === id);
    const dive = diveById.get(id);
    return {
      id,
      label: meta?.label?.split(" (")[0] ?? id,
      active: activeIds.includes(id),
      deepDived: !!dive,
      owner: trim(dive?.owner, 40),
      hours: trim(dive?.hours_per_week, 40),
      bottleneck: trim(dive?.pain, 100),
    };
  });

  // Tools: collapse rows, ignore "none", attach to functions whose deep-dive
  // mentions them (substring match on tools_touched).
  const tools: MapPayload["tools"] = toolsRaw
    .filter((t) => t?.product && String(t.product).toLowerCase() !== "none")
    .map((t) => {
      const product = String(t.product).trim();
      const linkedFns = functions
        .filter((fn) => {
          const dive = diveById.get(fn.id);
          if (!dive?.tools_touched) return false;
          return String(dive.tools_touched).toLowerCase().includes(product.toLowerCase().split(" ")[0]);
        })
        .map((fn) => fn.id);
      return { product, category: t.category, functions: linkedFns };
    });

  const payload: MapPayload = {
    company: { name: client?.company ?? client?.name ?? null, one_liner: trim(snap.one_liner, 90), scale: trim(snap.scale, 60) },
    market: { icp: trim(market.icp_segments, 110) },
    functions,
    tools,
    goal: trim(goals.goal_90d, 90),
    topBottlenecks: trim(goals.top_bottlenecks, 110),
    insights,
    completeness: {
      totalActive: activeIds.length,
      deepDived: functions.filter((f) => f.deepDived).length,
      toolsCaptured: tools.length,
    },
  };

  return NextResponse.json(payload);
}
