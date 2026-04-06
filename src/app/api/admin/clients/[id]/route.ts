import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.record;
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const adminPb = await createAdminClient();

    const client = await adminPb.collection('clients').getOne(id);

    const [
      onboarding_steps,
      brand_intake,
      brand_profiles,
      deliverables,
      scheduled_calls,
      documents,
      api_integrations,
    ] = await Promise.all([
      adminPb.collection('onboarding_steps').getFullList({ filter: `client_id = "${id}"`, sort: 'step_number' }),
      adminPb.collection('brand_intake').getFullList({ filter: `client_id = "${id}"` }),
      adminPb.collection('brand_profiles').getFullList({ filter: `client_id = "${id}"`, sort: '-version' }),
      adminPb.collection('deliverables').getFullList({ filter: `client_id = "${id}"`, sort: '-created' }),
      adminPb.collection('scheduled_calls').getFullList({ filter: `client_id = "${id}"`, sort: 'month' }),
      adminPb.collection('portal_documents').getFullList({ filter: `client_id = "${id}"`, sort: '-created' }),
      adminPb.collection('api_integrations').getFullList({ filter: `client_id = "${id}"` }),
    ]);

    return NextResponse.json({
      client,
      onboarding_steps,
      brand_intake: brand_intake[0] || null,
      brand_profiles,
      deliverables,
      scheduled_calls,
      documents,
      api_integrations,
    });
  } catch (err: any) {
    console.error('Admin client detail error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.record;
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['health_score', 'current_month', 'status', 'notes'];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const adminPb = await createAdminClient();
    const updated = await adminPb.collection('clients').update(id, updateData);

    return NextResponse.json({ client: updated });
  } catch (err: any) {
    console.error('Admin client update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
