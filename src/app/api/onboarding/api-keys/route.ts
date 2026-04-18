import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendSlackMessage } from "@/lib/slack";

// SECURITY: the full key value is sent to Slack once and is NEVER persisted
// in the database. Only a 4-char hint is kept for reference in api_integrations.

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: integrations } = await supabaseAdmin
      .from("api_integrations")
      .select("id, platform, key_name, key_hint, submitted_at")
      .eq("client_id", user.id)
      .order("submitted_at", { ascending: false });

    return NextResponse.json({ integrations: integrations ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform, key_name, key_value } = await req.json();
    if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
    if (!key_value) return NextResponse.json({ error: "Key value required" }, { status: 400 });

    const keyHint = String(key_value).slice(-4);

    const { error } = await supabaseAdmin.from("api_integrations").upsert(
      {
        client_id: user.id,
        platform,
        key_name: key_name || platform,
        key_hint: keyHint,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "client_id,platform,key_name" }
    );

    if (error) {
      console.error("api-keys upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send the FULL key to Slack. Never persist it in Supabase.
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("name, company")
        .eq("id", user.id)
        .maybeSingle();
      await sendSlackMessage(
        slackChannel,
        `API Key from ${client?.name ?? "client"} (${client?.company ?? ""}):\nPlatform: ${platform}\nKey: ${key_value}\n\nStore this securely and delete this message.`
      );
    }

    return NextResponse.json({ success: true, hint: keyHint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
