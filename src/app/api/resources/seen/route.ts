import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assignment_id } = await req.json();
    if (!assignment_id) return NextResponse.json({ error: 'Missing assignment_id' }, { status: 400 });

    const adminPb = await createAdminClient();
    await adminPb.collection('resource_assignments').update(assignment_id, {
      seen_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
