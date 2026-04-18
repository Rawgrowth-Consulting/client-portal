import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendSlackMessage } from "@/lib/slack";

const STEP_NAMES: Record<number, string> = {
  1: "Welcome",
  2: "Questionnaire",
  3: "Brand Profile",
  4: "Brand Documents",
  5: "API Keys",
  6: "Software Access",
  7: "Schedule Calls",
  8: "Complete",
};

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { step, data } = await req.json();
    if (typeof step !== "number") {
      return NextResponse.json({ error: "step required" }, { status: 400 });
    }

    const nextStep = Math.min(step + 1, 8);
    const updateFields: Record<string, any> = {
      onboarding_step: nextStep,
      updated_at: new Date().toISOString(),
    };

    // Save slack channel if provided in step 1
    if (step === 1 && data?.slack_channel) {
      updateFields.slack_channel_id = data.slack_channel;
    }

    // Onboarding complete at step 8 — flip status to active
    if (step >= 8) {
      updateFields.status = "active";
    }

    const { error } = await supabaseAdmin
      .from("clients")
      .update(updateFields)
      .eq("id", user.id);
    if (error) {
      console.error("Onboarding step update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      const clientName = client?.name || user.email;
      await sendSlackMessage(
        slackChannel,
        `${clientName} completed onboarding step ${step}: ${STEP_NAMES[step] || `Step ${step}`}`
      );
    }

    return NextResponse.json({ success: true, nextStep });
  } catch (err: any) {
    console.error("Onboarding step error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
