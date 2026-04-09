import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = user.id as Id<"clients">;
    const { sections } = await req.json();

    // Save all sections to brand intake
    for (const [sectionId, data] of Object.entries(sections)) {
      await convex.mutation(api.brandIntake.saveSection, {
        clientId,
        section: sectionId,
        data,
      });
    }

    // Submit intake to trigger profile creation
    await convex.mutation(api.brandIntake.submit, { clientId });

    // Trigger generation via Convex action
    await convex.action(api.brandProfile.generate, { clientId });

    // Get client for Slack notification
    const client = await convex.query(api.clients.get, { clientId });

    // Notify Slack
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
