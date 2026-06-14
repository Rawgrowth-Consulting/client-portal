import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminId } from "@/lib/admin-auth";

export async function GET() {
  if (!(await requireAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin.from("training_sources").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await requireAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("training_sources")
    .insert({
      name: b.name,
      category: b.category ?? "general",
      source_type: b.source_type ?? "manual",
      source_url: b.source_url ?? null,
      status: b.status ?? "active",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
}
