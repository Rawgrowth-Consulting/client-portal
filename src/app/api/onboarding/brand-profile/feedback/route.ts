import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { sendSlackMessage } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { feedback } = await req.json();

    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", user.id)
      .single();

    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel && client) {
      await sendSlackMessage(slackChannel, `Brand profile feedback from ${client.name}: ${feedback}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
