import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';

export async function POST(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.record;
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { client_id, health_score, current_month, status } = await req.json();

    if (!client_id) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const updateData: Record<string, any> = {};
    if (health_score !== undefined) updateData.health_score = health_score;
    if (current_month !== undefined) updateData.current_month = current_month;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const client = await adminPb.collection('clients').update(client_id, updateData);

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error('Admin client update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
