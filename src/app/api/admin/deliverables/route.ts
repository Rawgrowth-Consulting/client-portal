import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" as const, status: 401, user: null };
  if (user.role !== "admin") return { error: "Forbidden" as const, status: 403, user: null };
  return { error: null, status: 200, user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const clientId = req.nextUrl.searchParams.get("client_id");
    if (!clientId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const { data: deliverables, error } = await supabaseAdmin
      .from("deliverables")
      .select("*")
      .eq("client_id", clientId)
      .order("month", { ascending: true })
      .order("week", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deliverables: deliverables ?? [] });
  } catch (err: any) {
    console.error("Admin deliverables fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { client_id, month, week, title, description } = await req.json();
    if (!client_id || !month || !title) {
      return NextResponse.json(
        { error: "client_id, month, and title required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("deliverables")
      .insert({
        client_id,
        month,
        week: week ?? 1,
        title,
        description: description ?? null,
        completed: false,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deliverable: { id: data.id } });
  } catch (err: any) {
    console.error("Admin deliverable create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, completed } = await req.json();
    if (!id || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "id and completed required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("deliverables")
      .update({
        completed,
        status: completed ? "completed" : "pending",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin deliverable toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
