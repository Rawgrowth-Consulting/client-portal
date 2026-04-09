import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminPb = await createAdminClient();

    // Get client record
    const clients = await adminPb.collection('clients').getFullList({
      filter: `user_id = "${user.id}"`,
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'No client record found' }, { status: 404 });
    }

    const client = clients[0];

    // Check onboarding is complete
    if (!client.onboarding_completed_at) {
      return NextResponse.json({ error: 'Onboarding not complete' }, { status: 400 });
    }

    // Check for existing unused token
    try {
      const existing = await adminPb.collection('rawclaw_setup_tokens').getFullList({
        filter: `client_id = "${client.id}" && consumed = false`,
        sort: '-created',
      });
      if (existing.length > 0) {
        return NextResponse.json({ token: existing[0].token });
      }
    } catch {
      // Collection may not exist yet — will be created on first use
    }

    // Generate new token: RG- prefix + 32 hex chars
    const rawToken = crypto.randomBytes(16).toString('hex').toUpperCase();
    const token = `RG-${rawToken}`;

    await adminPb.collection('rawclaw_setup_tokens').create({
      client_id: client.id,
      token,
      consumed: false,
      consumed_at: null,
    });

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error('Generate token error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
