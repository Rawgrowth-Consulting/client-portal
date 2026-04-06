import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payload = body.payload;

    if (event !== 'invitee.created') {
      return NextResponse.json({ received: true });
    }

    const email = payload?.email || payload?.invitee?.email;
    if (!email) return NextResponse.json({ received: true });

    const adminPb = await createAdminClient();

    // Find client by email
    const users = await adminPb.collection('users').getFullList({ filter: `email = "${email}"` });
    if (users.length === 0) return NextResponse.json({ received: true });

    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${users[0].id}"` });
    if (clients.length === 0) return NextResponse.json({ received: true });

    const client = clients[0];

    // Find unbooked scheduled call and mark as confirmed
    const calls = await adminPb.collection('scheduled_calls').getFullList({
      filter: `client_id = "${client.id}" && scheduled_at = null`,
      sort: 'month',
    });

    if (calls.length > 0) {
      await adminPb.collection('scheduled_calls').update(calls[0].id, {
        scheduled_at: payload?.scheduled_event?.start_time || new Date().toISOString(),
      });
    }

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `Call booked: ${client.name} (${client.company}) scheduled via Calendly`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Calendly webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
