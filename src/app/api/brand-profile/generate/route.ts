import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { sendSlackMessage } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sections } = await req.json();

    // Save all sections to brand intake
    const updateData: Record<string, any> = { client_id: user.id };
    const SECTION_TO_COLUMN: Record<string, string> = {
      basicInfo: "basic_info", socialPresence: "social_presence", originStory: "origin_story",
      businessModel: "business_model", targetAudience: "target_audience", goals: "goals",
      challenges: "challenges", brandVoice: "brand_voice", competitors: "competitors",
      contentMessaging: "content_messaging", sales: "sales", toolsSystems: "tools_systems",
      additionalContext: "additional_context",
    };

    for (const [sectionId, data] of Object.entries(sections)) {
      const col = SECTION_TO_COLUMN[sectionId];
      if (col) updateData[col] = data;
    }
    updateData.submitted_at = Date.now();

    await supabase
      .from("brand_intakes")
      .upsert(updateData, { onConflict: "client_id" });

    // Create brand profile in "generating" state
    const { data: existingProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("client_id", user.id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = existingProfile ? 2 : 1;

    const { data: newProfile } = await supabase
      .from("brand_profiles")
      .insert({
        client_id: user.id,
        version: nextVersion,
        content: "",
        status: "generating",
        generated_at: Date.now(),
      })
      .select("id")
      .single();

    // Trigger AI generation
    if (newProfile) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/brand-profile/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: user.id, profileId: newProfile.id }),
      });
    }

    // Get client for Slack notification
    const { data: client } = await supabase
      .from("clients")
      .select("name, company")
      .eq("id", user.id)
      .single();

    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel && client) {
      await sendSlackMessage(
        slackChannel,
        `Brand profile generated for ${client.name || client.company}. Review at portal.rawgrowth.ai/admin`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Brand profile generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
