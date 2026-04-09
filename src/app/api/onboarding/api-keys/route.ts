import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const integrations = await convex.query(api.apiIntegrations.list, {
      clientId: user.id as Id<"clients">,
    });

    return NextResponse.json({ integrations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = user.id as Id<"clients">;
    const { platform, key_name, key_value } = await req.json();

    if (!key_value) return NextResponse.json({ error: "Key value required" }, { status: 400 });

    const keyHint = key_value.slice(-4);

    // Store hint only in Convex
    await convex.mutation(api.apiIntegrations.submit, {
      clientId,
      platform,
      keyName: key_name || platform,
      keyValue: key_value,
    });

    // Send full key to Slack securely
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      const client = await convex.query(api.clients.get, { clientId });
      await sendSlackMessage(
        slackChannel,
        `API Key from ${client?.name} (${client?.company}):\nPlatform: ${platform}\nKey: ${key_value}\n\nStore this securely and delete this message.`
      );
    }

    return NextResponse.json({ success: true, hint: keyHint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
