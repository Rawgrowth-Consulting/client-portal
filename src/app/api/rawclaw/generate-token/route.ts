import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Generate a Rawclaw install token.
// Clients can call this with no body to get their own token.
// Admins can call with { client_id } to get a token for any client.
// The token IS the client's Convex _id.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clientId: Id<"clients">;

    if (user.role === "admin") {
      // Admin can specify a client_id or use their own
      let body: any = {};
      try { body = await req.json(); } catch {}
      const targetClientId = body.client_id;

      if (targetClientId) {
        clientId = targetClientId as Id<"clients">;
      } else {
        clientId = user.id as Id<"clients">;
      }
    } else {
      // Regular client gets their own token
      clientId = user.id as Id<"clients">;
    }

    const client = await convex.query(api.clients.get, { clientId });

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
