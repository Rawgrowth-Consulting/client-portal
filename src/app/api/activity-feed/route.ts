import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = user.id as Id<"clients">;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const events = await convex.query(api.activityFeed.list, { clientId, limit });
  const unreadCount = await convex.query(api.activityFeed.unreadCount, { clientId });

  return NextResponse.json({
    events,
    unread_count: unreadCount,
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

  if (!event_ids || !Array.isArray(event_ids)) {
    return NextResponse.json({ error: "event_ids array required" }, { status: 400 });
  }

  await Promise.all(
    event_ids.map((id: string) =>
      convex.mutation(api.activityFeed.markRead, { eventId: id as Id<"activityFeed"> })
    )
  );

  return NextResponse.json({ success: true });
}
