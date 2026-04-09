import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = user.id as Id<"clients">;

    const [client, calls, deliverables, resourceAssignments] = await Promise.all([
      convex.query(api.clients.get, { clientId }),
      convex.query(api.scheduledCalls.list, { clientId }),
      convex.query(api.deliverables.list, { clientId }),
      convex.query(api.resources.listForClient, { clientId }),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const upcomingCalls = (calls || []).filter((c) => !c.completed);
    const recentDeliverables = (deliverables || [])
      .filter((d) => d.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 3);
    const unseenResourceCount = (resourceAssignments || []).filter(
      (r: any) => r.assignment && !r.assignment.seenAt
    ).length;

    return NextResponse.json({
      client: {
        id: client._id,
        name: client.name,
        company: client.company,
        status: client.status,
        health_score: client.healthScore,
        current_month: client.currentMonth,
        onboarding_step: client.onboardingStep,
        plan: (client as any).plan,
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
