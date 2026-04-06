import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const adminPb = await createAdminClient();

    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ intake: null });

    try {
      const intakes = await adminPb.collection('brand_intake').getFullList({ filter: `client_id = "${clients[0].id}"` });
      return NextResponse.json({ intake: intakes[0] || null });
    } catch {
      return NextResponse.json({ intake: null });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const { section_id, data } = await req.json();

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const clientId = clients[0].id;

    // Find or create brand_intake
    let intake;
    try {
      const intakes = await adminPb.collection('brand_intake').getFullList({ filter: `client_id = "${clientId}"` });
      intake = intakes[0];
    } catch {}

    const updateData: Record<string, any> = {};
    updateData[section_id] = JSON.stringify(data);

    if (intake) {
      await adminPb.collection('brand_intake').update(intake.id, updateData);
    } else {
      await adminPb.collection('brand_intake').create({ client_id: clientId, ...updateData });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
