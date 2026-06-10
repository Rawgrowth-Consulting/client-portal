import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { IMP_COOKIE, resolveClientUserId } from "@/lib/impersonation";

// FC-04: end the active impersonation, stamp ended_at, clear cookie, redirect
// back to the client's admin page. FC-05: no active session returns 400.
export async function POST() {
  const actor = await getAuthUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await cookies();
  const impId = store.get(IMP_COOKIE)?.value;
  if (!impId) {
    return NextResponse.json({ error: "no active session" }, { status: 400 });
  }

  const { data: row } = await supabaseAdmin
    .from("admin_impersonation_sessions")
    .select("id, client_id, admin_user_id, ended_at")
    .eq("id", impId)
    .maybeSingle();

  if (!row || row.ended_at) {
    // Stale or unknown cookie — clear it and report no active session.
    const res = NextResponse.json({ error: "no active session" }, { status: 400 });
    res.cookies.delete(IMP_COOKIE);
    return res;
  }

  // Only the admin who started the session may end it. Prevents an authenticated
  // user from ending someone else's session by guessing the session id.
  const adminUserId = await resolveClientUserId(actor.id);
  if (!adminUserId || row.admin_user_id !== adminUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabaseAdmin
    .from("admin_impersonation_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", impId);

  const res = NextResponse.json({ ok: true, redirect: `/admin/clients/${row.client_id}` });
  res.cookies.delete(IMP_COOKIE);
  return res;
}
