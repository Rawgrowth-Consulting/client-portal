import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });

    return NextResponse.json({ client: clients[0] || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const { name, company } = await req.json();

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await adminPb.collection('clients').update(clients[0].id, { name, company });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
