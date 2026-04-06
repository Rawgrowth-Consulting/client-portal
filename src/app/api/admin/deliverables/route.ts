import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';

export async function GET(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.record;
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientId = req.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const deliverables = await adminPb.collection('deliverables').getFullList({
      filter: `client_id = "${clientId}"`,
      sort: '-month,-week',
    });

    return NextResponse.json({ deliverables });
  } catch (err: any) {
    console.error('Admin deliverables fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const { client_id, month, week, title, description } = await req.json();

    if (!client_id || !month || !title) {
      return NextResponse.json({ error: 'client_id, month, and title required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const deliverable = await adminPb.collection('deliverables').create({
      client_id,
      month,
      week: week || 1,
      title,
      description: description || '',
      completed: false,
    });

    return NextResponse.json({ deliverable });
  } catch (err: any) {
    console.error('Admin deliverable create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.record;
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, completed } = await req.json();

    if (!id || completed === undefined) {
      return NextResponse.json({ error: 'id and completed required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const updateData: Record<string, any> = { completed };
    if (completed) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const deliverable = await adminPb.collection('deliverables').update(id, updateData);

    return NextResponse.json({ deliverable });
  } catch (err: any) {
    console.error('Admin deliverable toggle error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
