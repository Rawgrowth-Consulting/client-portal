import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { feedback } = await req.json();

    const client = await convex.query(api.clients.get, {
      clientId: user.id as Id<"clients">,
    });

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel && client) {
      await sendSlackMessage(slackChannel, `Brand profile feedback from ${client.name}: ${feedback}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
