import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminPb = await createAdminClient();

    const clients = await adminPb.collection('clients').getFullList({
      sort: '-created',
    });

    return NextResponse.json({ clients });
  } catch (err: any) {
    console.error('Admin clients error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
