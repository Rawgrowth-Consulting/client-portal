import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Rawclaw agents POST activity events here
// Auth: bearer token = client's Convex _id
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    // Token is the client's Convex _id
    let client;
    try {
      client = await convex.query(api.clients.get, {
        clientId: token as Id<"clients">,
      });
    } catch {
      // Not a valid ID format
    }

    if (!client) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, event_type, title, description, agentName, agent_name, metadata, severity } = body;

    const resolvedEventType = eventType || event_type;
    const resolvedAgentName = agentName || agent_name;

    if (!resolvedEventType || !title) {
      return NextResponse.json({ error: "event_type and title required" }, { status: 400 });
    }

    const validSeverities = ["info", "success", "warning", "error"];
    const resolvedSeverity = validSeverities.includes(severity) ? severity : "info";

    await convex.mutation(api.activityFeed.log, {
      clientId: client._id,
      eventType: resolvedEventType,
      title,
      description: description || title,
      agentName: resolvedAgentName || undefined,
      metadata: metadata || undefined,
      severity: resolvedSeverity,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Rawclaw activity error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
