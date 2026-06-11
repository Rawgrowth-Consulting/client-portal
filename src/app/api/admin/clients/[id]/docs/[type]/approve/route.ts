import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveClientUserId } from "@/lib/impersonation";
import { DOC_TYPES, type DocType } from "@/lib/docs/types";

// FC-04: admin approves the latest version of one doc type for a client.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
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

  const { id: clientId, type } = await params;
  if (!DOC_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: "unknown doc type" }, { status: 400 });
  }

  const { data: latest } = await supabaseAdmin
    .from("client_profile_documents")
    .select("id, approved_at")
    .eq("client_id", clientId)
    .eq("type", type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    return NextResponse.json({ error: "doc not generated yet" }, { status: 400 });
  }

  const approvedBy = await resolveClientUserId(actor.id);
  const { data: updated, error } = await supabaseAdmin
    .from("client_profile_documents")
    .update({ approved_at: new Date().toISOString(), approved_by: approvedBy })
    .eq("id", latest.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, doc: updated });
}
