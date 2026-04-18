import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendSlackMessage } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payload = body.payload;

    if (event !== "invitee.created") {
      return NextResponse.json({ received: true });
    }

    const rawEmail: string | undefined =
      payload?.email || payload?.invitee?.email;
    if (!rawEmail) return NextResponse.json({ received: true });
    const email = rawEmail.trim().toLowerCase();

    // Find client by email
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id, name, company")
      .eq("email", email)
      .maybeSingle();

    if (!client) return NextResponse.json({ received: true });

    // Pick the earliest unscheduled, non-completed call for this client
    const { data: unscheduledCalls } = await supabaseAdmin
      .from("scheduled_calls")
      .select("id, title, month, week")
      .eq("client_id", client.id)
      .eq("completed", false)
      .is("scheduled_at", null)
      .order("month", { ascending: true })
      .order("week", { ascending: true })
      .limit(1);

    const next = unscheduledCalls?.[0];
    if (next) {
      const scheduledAt = payload?.scheduled_event?.start_time
        ? new Date(payload.scheduled_event.start_time).getTime()
        : Date.now();

      await supabaseAdmin
        .from("scheduled_calls")
        .update({ scheduled_at: scheduledAt })
        .eq("id", next.id);
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
