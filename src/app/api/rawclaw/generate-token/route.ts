import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Admin endpoint to generate a Rawclaw install token for a client
// The token IS the client's Convex _id (simple, auditable, no one-time-use complexity)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { client_id } = await req.json();
    if (!client_id) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const client = await convex.query(api.clients.get, {
      clientId: client_id as Id<"clients">,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.rawgrowth.ai"}/api/rawclaw/setup/${client._id}`;

    return NextResponse.json({
      token: client._id,
      setup_url: setupUrl,
    });
  } catch (err: any) {
    console.error("Generate token error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
