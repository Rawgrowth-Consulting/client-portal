import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';
import { sendMagicLinkEmail } from '@/lib/resend';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const pb = await createAdminClient();

    // Check if user exists
    let user;
    try {
      const users = await pb.collection('users').getFullList({ filter: `email = "${email}"` });
      user = users[0];
    } catch {
      // User not found
    }

    if (!user) {
      return NextResponse.json({ error: 'No account found for this email' }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store magic link
    await pb.collection('magic_links').create({
      email,
      token,
      expires_at: expiresAt,
      used: false,
    });

    // Send email
    const result = await sendMagicLinkEmail(email, token);

    return NextResponse.json({
      success: true,
      ...(result && 'link' in result && !process.env.RESEND_API_KEY ? { debug_link: result.link } : {})
    });
  } catch (err: any) {
    console.error('Magic link error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
