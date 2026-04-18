import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    if (health_score !== undefined) fields.health_score = health_score;
    if (current_month !== undefined) fields.current_month = current_month;
    if (status !== undefined) fields.status = status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.updated_at = new Date().toISOString();

    const { data: client, error } = await supabaseAdmin
      .from("clients")
      .update(fields)
      .eq("id", client_id)
      .select("*")
      .single();

    if (error) {
      console.error("Admin client update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error("Admin client update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
