import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Generate a Rawclaw install token.
// Clients can call this with no body to get their own token.
// Admins can call with { client_id } to get a token for any client.
// The token IS the client's Supabase `clients.id` (UUID).
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clientId = user.id;

    if (user.role === "admin") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {}
      if (body.client_id) clientId = body.client_id;
    }

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.rawgrowth.ai"}/api/rawclaw/setup/${client.id}`;

    return NextResponse.json({ token: client.id, setup_url: setupUrl });
  } catch (err: any) {
    console.error("Generate token error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
