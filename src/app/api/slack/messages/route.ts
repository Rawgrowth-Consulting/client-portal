import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { getSlackMessages } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await convex.query(api.clients.get, {
      clientId: user.id as Id<"clients">,
    });

    if (!client) return NextResponse.json({ fallback: true });

    const channelId = client.slackChannelId;
    if (!channelId) return NextResponse.json({ fallback: true });

    if (!process.env.SLACK_BOT_TOKEN) return NextResponse.json({ fallback: true });

    const messages = await getSlackMessages(channelId, 50);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Slack messages error:", err);
    return NextResponse.json({ fallback: true });
  }
}
