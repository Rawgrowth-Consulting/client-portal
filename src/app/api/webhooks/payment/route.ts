import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';
import { sendMagicLinkEmail } from '@/lib/resend';
import { sendSlackMessage } from '@/lib/slack';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract from Stripe or n8n webhook payload
    const email = body.email || body.customer_email || body.data?.object?.customer_email;
    const name = body.name || body.customer_name || body.data?.object?.customer_name || '';
    const company = body.company || body.metadata?.company || '';

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    // Check if user already exists
    let user;
    try {
      const users = await adminPb.collection('users').getFullList({ filter: `email = "${email}"` });
      user = users[0];
    } catch {}

    // Create user if not exists
    if (!user) {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      user = await adminPb.collection('users').create({
        email,
        password: tempPassword,
        passwordConfirm: tempPassword,
        name,
      });
    }

    // Check if client record exists
    let client;
    try {
      const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${user.id}"` });
      client = clients[0];
    } catch {}

    if (!client) {
      client = await adminPb.collection('clients').create({
        user_id: user.id,
        name,
        email,
        company,
        status: 'onboarding',
        onboarding_step: 1,
        current_month: 1,
        health_score: 100,
        role: 'client',
      });
    }

    // Generate magic link
    const token = crypto.randomBytes(32).toString('hex');
    await adminPb.collection('magic_links').create({
      email,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days for initial
      used: false,
    });

    // Send magic link email
    const result = await sendMagicLinkEmail(email, token);

    // Create default scheduled calls
    const calls = [
      { title: 'Week 1 Kickoff', month: 1, week: 1 },
      { title: 'Month 2 Kickoff', month: 2, week: 5 },
      { title: 'Month 3 Kickoff', month: 3, week: 9 },
      { title: 'Month 4 Review & Growth Plan', month: 4, week: 13 },
    ];

    for (const call of calls) {
      try {
        await adminPb.collection('scheduled_calls').create({
          client_id: client.id,
          title: call.title,
          month: call.month,
          week: call.week,
          calendly_url: 'https://calendly.com/chriswestt/rawgrowth-discovery',
          completed: false,
        });
      } catch {}
    }

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `New client payment received: ${name} (${email}) - ${company}\nMagic link sent. Portal: portal.rawgrowth.ai/admin/clients/${client.id}`);
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      ...(result && 'link' in result ? { debug_link: result.link } : {}),
    });
  } catch (err: any) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
