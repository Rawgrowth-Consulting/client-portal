import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const pb = await createAdminClient();

    // Find magic link
    let magicLink;
    try {
      const links = await pb.collection('magic_links').getFullList({
        filter: `token = "${token}" && used = false`,
      });
      magicLink = links[0];
    } catch {
      return NextResponse.json({ error: 'Invalid link' }, { status: 401 });
    }

    if (!magicLink) {
      return NextResponse.json({ error: 'Invalid or used link' }, { status: 401 });
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 401 });
    }

    // Mark as used
    await pb.collection('magic_links').update(magicLink.id, { used: true });

    // Find user
    const users = await pb.collection('users').getFullList({
      filter: `email = "${magicLink.email}"`,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Impersonate user using admin client
    // PocketBase admin can create auth tokens for users
    const authPb = await createAdminClient();

    // Use impersonate to get a user token
    const impersonateRes = await (authPb.collection('users') as any).impersonate(user.id, 2592000); // 30 day duration

    // Determine redirect
    let redirect = '/dashboard';
    try {
      const clients = await pb.collection('clients').getFullList({
        filter: `user_id = "${user.id}"`,
      });
      if (clients.length > 0) {
        const client = clients[0];
        if (client.role === 'admin') {
          redirect = '/admin';
        } else if (!client.onboarding_completed_at) {
          const step = client.onboarding_step || 1;
          const steps: Record<number, string> = { 1: '1-welcome', 2: '2-questionnaire', 3: '3-brand-profile', 4: '4-brand-docs', 5: '5-api-keys', 6: '6-software-access', 7: '7-schedule-calls', 8: '8-complete' };
          redirect = `/onboarding/${steps[step] || '1-welcome'}`;
        }
      }
    } catch {}

    const response = NextResponse.json({ success: true, redirect });

    response.cookies.set('pb_auth', JSON.stringify({
      token: impersonateRes.token,
      model: user,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
