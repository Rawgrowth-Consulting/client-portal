import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

  const [{ data: events, error: eventsErr }, { count, error: countErr }] =
    await Promise.all([
      supabaseAdmin
        .from("activity_feed")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("activity_feed")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id)
        .is("read_at", null),
    ]);

  if (eventsErr || countErr) {
    const err = eventsErr || countErr;
    console.error("Activity feed fetch error:", err);
    return NextResponse.json({ error: err!.message }, { status: 500 });
  }

  return NextResponse.json({
    events: events ?? [],
    unread_count: count ?? 0,
    has_more: (events?.length || 0) === limit,
  });
}

// Mark events as read
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event_ids } = body;

  if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
    return NextResponse.json({ error: "event_ids array required" }, { status: 400 });
  }

  // Scope the update to this user's rows so one user can't mark another's events read.
  const { error } = await supabaseAdmin
    .from("activity_feed")
    .update({ read_at: Date.now() })
    .in("id", event_ids)
    .eq("client_id", user.id);

  if (error) {
    console.error("Activity feed mark-read error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
