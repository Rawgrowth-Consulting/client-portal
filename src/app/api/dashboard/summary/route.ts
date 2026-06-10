import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-side dashboard data. Auth is enforced via NextAuth session; reads run
// with the service role and are scoped to the effective client id (the
// impersonated client when an admin is impersonating). This keeps the Supabase
// secret key server-only — the browser never queries the DB directly.
export async function GET() {
  const eff = await getEffectiveUser();
  if (!eff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = eff.effective.id;
  const [clientRes, callsRes, activityRes, brandProfileRes, accessRes, typedDocsRes] =
    await Promise.all([
      supabaseAdmin.from("clients").select("*").eq("id", clientId).maybeSingle(),
      supabaseAdmin
        .from("scheduled_calls")
        .select("*")
        .eq("client_id", clientId)
        .order("scheduled_at", { ascending: true }),
      supabaseAdmin
        .from("activity_feed")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin.from("brand_profiles").select("id,approved_at,status").eq("client_id", clientId),
      supabaseAdmin.from("software_access").select("id,status").eq("client_id", clientId),
      supabaseAdmin.from("client_profile_documents").select("id,approved_at").eq("client_id", clientId),
    ]);

  return NextResponse.json({
    client: clientRes.data ?? null,
    calls: callsRes.data ?? [],
    activity: activityRes.data ?? [],
    checklist: {
      brandProfiles: brandProfileRes.data ?? [],
      access: accessRes.data ?? [],
      // typedDocs may error pre-F-001; treat error as empty set.
      typedDocs: typedDocsRes.error ? [] : (typedDocsRes.data ?? []),
    },
  });
}
