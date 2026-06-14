import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminId } from "@/lib/admin-auth";

const toArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

export async function GET() {
  if (!(await requireAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin
    .from("training_materials")
    .select("*, training_sources(name, category)")
    .order("created_at", { ascending: false });
  return NextResponse.json({ materials: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await requireAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!b?.content_markdown) return NextResponse.json({ error: "content_markdown required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("training_materials")
    .insert({
      training_source_id: b.training_source_id ?? null,
      title: b.title,
      summary: b.summary ?? null,
      content_markdown: b.content_markdown,
      tags: toArr(b.tags),
      business_types: toArr(b.business_types),
      use_cases: toArr(b.use_cases),
      source_file_id: b.source_file_id ?? null,
      embedding_status: b.embedding_status ?? "skipped",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}
