import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Rawclaw agents POST activity events here.
// Auth: Bearer token = client's Supabase `clients.id` (UUID)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("id", token)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const {
      eventType,
      event_type,
      title,
      description,
      agentName,
      agent_name,
      metadata,
      severity,
    } = body;

    const resolvedEventType = eventType || event_type;
    const resolvedAgentName = agentName || agent_name;

    if (!resolvedEventType || !title) {
      return NextResponse.json(
        { error: "event_type and title required" },
        { status: 400 }
      );
    }

    const validSeverities = ["info", "success", "warning", "error"];
    const resolvedSeverity = validSeverities.includes(severity) ? severity : "info";

    const { error } = await supabaseAdmin.from("activity_feed").insert({
      client_id: client.id,
      event_type: resolvedEventType,
      title,
      description: description || title,
      agent_name: resolvedAgentName || null,
      metadata: metadata || null,
      severity: resolvedSeverity,
    });

    if (error) {
      console.error("Rawclaw activity insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Rawclaw activity error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
