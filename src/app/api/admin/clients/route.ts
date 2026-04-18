import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: clients, error } = await supabaseAdmin
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin clients list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: clients ?? [] });
  } catch (err: any) {
    console.error("Admin clients error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const company = (body.company || "").trim();

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: "Name, email and company are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("clients")
      .insert({
        name,
        email,
        company,
        role: "client",
        current_month: 1,
        health_score: 0,
        status: "onboarding",
      })
      .select("id")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("Create client error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
