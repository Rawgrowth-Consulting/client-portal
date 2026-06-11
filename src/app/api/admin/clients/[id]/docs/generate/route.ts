import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runProfileDocsForClient } from "@/lib/docs/generate-all";

// Admin-initiated generation / retry of the 10 profile documents (FC-02 / FC-08).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAuthUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: actorClient } = await supabaseAdmin
    .from("clients")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle();
  if (actorClient?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: clientId } = await params;
  const { inserted, failed } = await runProfileDocsForClient(clientId);
  return NextResponse.json({ ok: true, inserted, failed });
}
