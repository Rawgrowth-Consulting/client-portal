import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { client_id, health_score, current_month, status } = await req.json();

    if (!client_id) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const fields: Record<string, any> = {};
    if (health_score !== undefined) fields.healthScore = health_score;
    if (current_month !== undefined) fields.currentMonth = current_month;
    if (status !== undefined) fields.status = status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await convex.mutation(api.clients.update, {
      clientId: client_id as Id<"clients">,
      fields,
    });

    const client = await convex.query(api.clients.get, { clientId: client_id as Id<"clients"> });

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error("Admin client update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
