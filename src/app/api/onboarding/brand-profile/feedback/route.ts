import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

export async function POST(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = pb.authStore.record?.id;
    const { feedback } = await req.json();

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const client = clients[0];

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `Brand profile feedback from ${client.name}: ${feedback}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
