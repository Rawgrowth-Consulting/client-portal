import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { IMP_COOKIE, resolveClientUserId } from "@/lib/impersonation";

// FC-01: admin starts impersonating a client. Writes an audit row and sets the
// session cookie. FC-05/FC-06: non-admins get 403, missing reason gets 400, and
// neither writes a row.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }

  const { id: targetClientId } = await params;

  // Contract forbids admin-to-admin impersonation (no privilege chaining).
  const { data: targetClient } = await supabaseAdmin
    .from("clients")
    .select("role")
    .eq("id", targetClientId)
    .maybeSingle();
  if (!targetClient) {
    return NextResponse.json({ error: "client not found" }, { status: 404 });
  }
  if (targetClient.role === "admin") {
    return NextResponse.json({ error: "cannot impersonate an admin" }, { status: 400 });
  }

  const adminUserId = await resolveClientUserId(actor.id);
  const clientUserId = await resolveClientUserId(targetClientId);
  if (!adminUserId || !clientUserId) {
    return NextResponse.json({ error: "client user not found" }, { status: 400 });
  }

  // One active impersonation per admin: close any dangling sessions first.
  await supabaseAdmin
    .from("admin_impersonation_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("admin_user_id", adminUserId)
    .is("ended_at", null);

  const { data: row, error } = await supabaseAdmin
    .from("admin_impersonation_sessions")
    .insert({
      admin_user_id: adminUserId,
      client_user_id: clientUserId,
      client_id: targetClientId,
      reason,
    })
    .select("id")
    .single();

  if (error || !row) {
    // 23505 = unique violation from the one-active-per-admin partial index
    // (concurrent double-POST). The other request already started a session.
    if (error?.code === "23505") {
      return NextResponse.json({ error: "already impersonating" }, { status: 409 });
    }
    return NextResponse.json({ error: "could not start impersonation" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, redirect: "/dashboard" });
  res.cookies.set(IMP_COOKIE, row.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  return res;
}
