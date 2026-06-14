import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getEffectiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Response } from "@/components/ui/response";

const PANEL = { background: "#0A1210", border: "1px solid rgba(255,255,255,0.06)" };

// Read-only material view. Only renders if the material is assigned to this
// client (prevents reading arbitrary library content).
export default async function TrainingMaterialPage({ params }: { params: Promise<{ material_id: string }> }) {
  const eff = await getEffectiveUser();
  if (!eff) redirect("/login");
  if (eff.effective.role === "admin" && !eff.impersonating) redirect("/admin");
  const { material_id } = await params;

  const { data: assignment } = await supabaseAdmin
    .from("client_training_assignments")
    .select("id")
    .eq("client_id", eff.effective.id)
    .eq("training_material_id", material_id)
    .maybeSingle();
  if (!assignment) notFound();

  const { data: material } = await supabaseAdmin
    .from("training_materials")
    .select("title, summary, content_markdown")
    .eq("id", material_id)
    .maybeSingle();
  if (!material) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/training" className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          ← Training
        </Link>
      </div>
      <div className="rounded-xl p-6" style={PANEL}>
        <h1 className="mb-2 text-2xl font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
          {material.title}
        </h1>
        {material.summary && (
          <p className="mb-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {material.summary}
          </p>
        )}
        <Response>{material.content_markdown}</Response>
      </div>
    </div>
  );
}
