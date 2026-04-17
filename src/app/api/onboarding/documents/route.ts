import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", user.id);

    return NextResponse.json({ documents: documents || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, storage_url, filename, size } = await req.json();

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        client_id: user.id,
        type,
        storage_url,
        filename,
        size,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ document: doc });
  } catch (err: any) {
    console.error("Document save error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
