import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import { getSlackMessages } from '@/lib/slack';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });

    if (clients.length === 0) return NextResponse.json({ fallback: true });

    const channelId = clients[0].slack_channel_id;
    if (!channelId) return NextResponse.json({ fallback: true });

    if (!process.env.SLACK_BOT_TOKEN) return NextResponse.json({ fallback: true });

    const messages = await getSlackMessages(channelId, 50);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Slack messages error:', err);
    return NextResponse.json({ fallback: true });
  }
}
