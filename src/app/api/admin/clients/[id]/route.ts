import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const clientId = id as Id<"clients">;

    const [client, onboarding_steps, brand_intake, deliverables, scheduled_calls] = await Promise.all([
      convex.query(api.clients.get, { clientId }),
      convex.query(api.clients.getOnboardingSteps, { clientId }),
      convex.query(api.brandIntake.get, { clientId }),
      convex.query(api.deliverables.list, { clientId }),
      convex.query(api.scheduledCalls.list, { clientId }),
    ]);

    const brand_profiles = client
      ? [await convex.query(api.brandProfile.get, { clientId })].filter(Boolean)
      : [];

    return NextResponse.json({
      client,
      onboarding_steps,
      brand_intake,
      brand_profiles,
      deliverables,
      scheduled_calls,
    });
  } catch (err: any) {
    console.error("Admin client detail error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowedFields = ["healthScore", "currentMonth", "status", "health_score", "current_month"];
    const fields: Record<string, any> = {};

    // Support both camelCase and snake_case from admin UI
    if (body.health_score !== undefined) fields.healthScore = body.health_score;
    if (body.current_month !== undefined) fields.currentMonth = body.current_month;
    if (body.healthScore !== undefined) fields.healthScore = body.healthScore;
    if (body.currentMonth !== undefined) fields.currentMonth = body.currentMonth;
    if (body.status !== undefined) fields.status = body.status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await convex.mutation(api.clients.update, {
      clientId: id as Id<"clients">,
      fields,
    });

    const client = await convex.query(api.clients.get, { clientId: id as Id<"clients"> });
    return NextResponse.json({ client });
  } catch (err: any) {
    console.error("Admin client update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
