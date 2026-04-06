import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

export async function POST(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = pb.authStore.record?.id;
    const { platform, key_name, key_value } = await req.json();

    if (!key_value) return NextResponse.json({ error: 'Key value required' }, { status: 400 });

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const client = clients[0];
    const keyHint = key_value.slice(-4);

    // Store hint only in PocketBase
    await adminPb.collection('api_integrations').create({
      client_id: client.id,
      platform,
      key_name: key_name || platform,
      key_hint: keyHint,
      submitted_at: new Date().toISOString(),
    });

    // Send full key to Slack securely
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `API Key from ${client.name} (${client.company}):\nPlatform: ${platform}\nKey: ${key_value}\n\nStore this securely and delete this message.`);
    }

    return NextResponse.json({ success: true, hint: keyHint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
