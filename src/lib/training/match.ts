import { supabaseAdmin } from "@/lib/supabase-admin";

// F-005 match: score every training_material against a client's derived tags and
// write the top matches to client_training_assignments. Tags are derived from
// the client's intake (business model + goals) since there's no explicit
// business_types column on clients.

const STOP = new Set(["the", "and", "for", "with", "our", "your", "are", "that", "this", "from", "have", "more", "into", "want", "need", "get"]);

function keywords(text: string): Set<string> {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
  );
}

// Derive {businessTypes, goalKeywords} from the client's intake jsonb.
export function clientTags(intake: Record<string, any> | null): { businessTypes: Set<string>; goalKeywords: Set<string> } {
  const i = intake ?? {};
  const basic = i.basic_info ?? {};
  const model = i.business_model ?? {};
  const goals = i.goals ?? {};
  const bizText = [basic.business_model, basic.what_you_sell, basic.one_liner, model.active_functions].flat().filter(Boolean).join(" ");
  const businessTypes = keywords(bizText);
  // common explicit types
  for (const t of ["ecommerce", "agency", "coaching", "consulting", "saas", "service", "retail", "wholesale", "medical"]) {
    if (bizText.toLowerCase().includes(t)) businessTypes.add(t === "agency" ? "marketing_agency" : t === "service" ? "service_business" : t);
  }
  const goalKeywords = keywords([goals.goal_90d, goals.vision_12mo, goals.top_bottlenecks, goals.ten_hours_back].filter(Boolean).join(" "));
  return { businessTypes, goalKeywords };
}

function overlap(a: Set<string>, b: string[] | null): number {
  if (!Array.isArray(b) || b.length === 0) return 0;
  let n = 0;
  for (const x of b) if (a.has(String(x).toLowerCase())) n++;
  return n;
}

export type MatchResult = { assigned: number; topScore: number; emptyMatch: boolean };

export async function matchTrainingForClient(clientId: string, adminUserId?: string | null): Promise<MatchResult> {
  const { data: intake } = await supabaseAdmin.from("brand_intakes").select("*").eq("client_id", clientId).maybeSingle();
  const { businessTypes, goalKeywords } = clientTags(intake);

  const { data: materials } = await supabaseAdmin
    .from("training_materials")
    .select("id, business_types, use_cases, tags");

  const scored = (materials ?? [])
    .map((m) => {
      const total = (m.tags?.length ?? 0) + (m.business_types?.length ?? 0) + (m.use_cases?.length ?? 0) || 1;
      const hits = overlap(businessTypes, m.business_types) + overlap(goalKeywords, m.use_cases) + overlap(goalKeywords, m.tags);
      const score = hits / total;
      const reasons: string[] = [];
      if (overlap(businessTypes, m.business_types)) reasons.push("business type match");
      if (overlap(goalKeywords, m.use_cases)) reasons.push("use-case/goal match");
      return { id: m.id, score, reason: reasons.join(", ") || "tag overlap" };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (scored.length === 0) return { assigned: 0, topScore: 0, emptyMatch: true };

  for (const m of scored) {
    await supabaseAdmin
      .from("client_training_assignments")
      .upsert(
        { client_id: clientId, training_material_id: m.id, reason: m.reason, score: m.score, assigned_by: adminUserId ?? null },
        { onConflict: "client_id,training_material_id" }
      );
  }
  return { assigned: scored.length, topScore: scored[0].score, emptyMatch: false };
}
