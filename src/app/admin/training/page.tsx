import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import TrainingAdmin from "./TrainingAdmin";

// F-005 admin: manage the training library (sources + materials). Admin-only via
// layout + requireAdmin.
export default async function AdminTrainingPage() {
  await requireAdmin();
  const [{ data: sources }, { data: materials }] = await Promise.all([
    supabaseAdmin.from("training_sources").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("training_materials").select("*").order("created_at", { ascending: false }),
  ]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
        Training Library
      </h1>
      <TrainingAdmin sources={sources ?? []} materials={materials ?? []} />
    </div>
  );
}
