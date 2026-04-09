import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payload = body.payload;

    if (event !== "invitee.created") {
      return NextResponse.json({ received: true });
    }

    const email = payload?.email || payload?.invitee?.email;
    if (!email) return NextResponse.json({ received: true });

    // Find client by email
    const client = await convex.query(api.clients.getByEmail, { email });
    if (!client) return NextResponse.json({ received: true });

    // Find first unscheduled call and mark it scheduled
    const calls = await convex.query(api.scheduledCalls.list, { clientId: client._id });
    const unscheduled = calls.filter((c) => !c.scheduledAt && !c.completed);

    if (unscheduled.length > 0) {
      const scheduledAt = payload?.scheduled_event?.start_time
        ? new Date(payload.scheduled_event.start_time).getTime()
        : Date.now();

      await convex.mutation(api.scheduledCalls.schedule, {
        clientId: client._id,
        title: unscheduled[0].title,
        month: unscheduled[0].month,
        week: unscheduled[0].week,
        scheduledAt,
      });
    }

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(
        slackChannel,
        `Call booked: ${client.name} (${client.company}) scheduled via Calendly`
      );
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Calendly webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
