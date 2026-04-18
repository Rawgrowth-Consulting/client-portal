import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSlackMessages } from "@/lib/slack";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("slack_channel_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!client?.slack_channel_id) return NextResponse.json({ fallback: true });
    if (!process.env.SLACK_BOT_TOKEN) return NextResponse.json({ fallback: true });

    const messages = await getSlackMessages(client.slack_channel_id, 50);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Slack messages error:", err);
    return NextResponse.json({ fallback: true });
  }
}
