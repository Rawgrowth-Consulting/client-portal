import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = user.id as Id<"clients">;
    const { step, data } = await req.json();

    const stepNames: Record<number, string> = {
      1: "Welcome", 2: "Questionnaire", 3: "Brand Profile", 4: "Brand Documents",
      5: "API Keys", 6: "Software Access", 7: "Schedule Calls", 8: "Complete",
    };

    // Upsert the onboarding step
    await convex.mutation(api.onboardingSteps.upsert, {
      clientId,
      stepNumber: step,
      stepName: stepNames[step] || `Step ${step}`,
      data: data || {},
    });

    // Advance client's onboarding step
    const nextStep = Math.min(step + 1, 8);
    const updateFields: Record<string, any> = { onboardingStep: nextStep };

    // Save slack channel if provided in step 1
    if (step === 1 && data?.slack_channel) {
      updateFields.slackChannelId = data.slack_channel;
    }

    // Mark onboarding complete at step 8
    if (step >= 8) {
      updateFields.onboardingCompletedAt = Date.now();
      updateFields.status = "active";
    }

    await convex.mutation(api.clients.update, {
      clientId,
      fields: updateFields,
    });

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      const client = await convex.query(api.clients.get, { clientId });
      const clientName = client?.name || user.email;
      await sendSlackMessage(
        slackChannel,
        `${clientName} completed onboarding step ${step}: ${stepNames[step]}`
      );
    }

    return NextResponse.json({ success: true, nextStep });
  } catch (err: any) {
    console.error("Onboarding step error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
