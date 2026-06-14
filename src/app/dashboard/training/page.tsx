import { redirect } from "next/navigation";
import Link from "next/link";
import { getEffectiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PANEL = { background: "#0A1210", border: "1px solid rgba(255,255,255,0.06)" };

// F-005 client view: assignments grouped by training source category. Scoped to
// the effective client (impersonation-aware). Auth via dashboard layout.
export default async function TrainingPage() {
  const eff = await getEffectiveUser();
  if (!eff) redirect("/login");
  if (eff.effective.role === "admin" && !eff.impersonating) redirect("/admin");

  const { data: rows } = await supabaseAdmin
    .from("client_training_assignments")
    .select("training_material_id, score, training_materials(id, title, summary, training_sources(category))")
    .eq("client_id", eff.effective.id)
    .order("score", { ascending: false });

  const groups = new Map<string, { id: string; title: string; summary: string | null }[]>();
  for (const r of rows ?? []) {
    const m = (r as any).training_materials;
    if (!m) continue;
    const cat = m.training_sources?.category || "general";
    (groups.get(cat) ?? groups.set(cat, []).get(cat)!).push({ id: m.id, title: m.title, summary: m.summary });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
        Training & Resources
      </h1>
      {groups.size === 0 ? (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          No training assigned yet. Your Rawgrowth team curates this from your onboarding.
        </p>
      ) : (
        [...groups.entries()].map(([cat, mats]) => (
          <div key={cat} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              {cat}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {mats.map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/training/${m.id}`}
                  className="rounded-xl p-5 transition-colors hover:border-[rgba(12,191,106,0.4)]"
                  style={PANEL}
                >
                  <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {m.title}
                  </div>
                  {m.summary && (
                    <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {m.summary}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
