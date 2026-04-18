import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      { data: client },
      { data: calls },
      { data: deliverables },
    ] = await Promise.all([
      supabaseAdmin
        .from("clients")
        .select(
          "id, name, company, status, health_score, current_month, onboarding_step"
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("scheduled_calls")
        .select("*")
        .eq("client_id", user.id)
        .order("month", { ascending: true })
        .order("week", { ascending: true }),
      supabaseAdmin
        .from("deliverables")
        .select("*")
        .eq("client_id", user.id)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(50),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const upcomingCalls = (calls ?? []).filter((c: any) => !c.completed);
    const recentDeliverables = (deliverables ?? [])
      .filter((d: any) => d.completed)
      .slice(0, 3);

    // Resources aren't backed by Supabase yet — always zero for now.
    const unseenResourceCount = 0;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        status: client.status,
        health_score: client.health_score,
        current_month: client.current_month,
        onboarding_step: client.onboarding_step,
      },
      upcoming_calls: upcomingCalls,
      recent_deliverables: recentDeliverables,
      unseen_resource_count: unseenResourceCount,
    });
  } catch (err: any) {
    console.error("Dashboard home error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
