import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';

export async function GET() {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = pb.authStore.record?.id;
    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ profile: null });

    const profiles = await adminPb.collection('brand_profiles').getFullList({
      filter: `client_id = "${clients[0].id}"`,
      sort: '-version',
    });

    return NextResponse.json({ profile: profiles[0] || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
