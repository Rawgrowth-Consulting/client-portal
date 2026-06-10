import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const [clientRes, intakeRes, deliverablesRes, callsRes, profilesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("brand_intakes").select("*").eq("client_id", id).single(),
      supabase.from("deliverables").select("*").eq("client_id", id),
      supabase.from("scheduled_calls").select("*").eq("client_id", id),
      supabase.from("brand_profiles").select("*").eq("client_id", id).order("version", { ascending: false }),
    ]);

    return NextResponse.json({
      client: clientRes.data,
      brand_intake: intakeRes.data,
      brand_profiles: profilesRes.data || [],
      deliverables: deliverablesRes.data || [],
      scheduled_calls: callsRes.data || [],
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const fields: Record<string, any> = {};
    if (body.health_score !== undefined) fields.health_score = body.health_score;
    if (body.healthScore !== undefined) fields.health_score = body.healthScore;
    if (body.current_month !== undefined) fields.current_month = body.current_month;
    if (body.currentMonth !== undefined) fields.current_month = body.currentMonth;
    if (body.status !== undefined) fields.status = body.status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await supabase.from("clients").update(fields).eq("id", id);

    const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
    return NextResponse.json({ client });
  } catch (err: any) {
    console.error("Admin client update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
