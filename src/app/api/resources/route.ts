import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const adminPb = await createAdminClient();

    const clients = await adminPb.collection('clients').getFullList({
      filter: `user_id = "${userId}"`,
    });

    if (clients.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    const client = clients[0];

    const assignments = await adminPb.collection('resource_assignments').getFullList({
      filter: `client_id = "${client.id}"`,
      sort: '-created',
    });

    const resources = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const resource = await adminPb.collection('portal_resources').getOne(assignment.resource_id);
          return {
            ...resource,
            assignment_id: assignment.id,
            seen_at: assignment.seen_at,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      resources: resources.filter(Boolean),
    });
  } catch (err: any) {
    console.error('Resources fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_assignment_id } = await req.json();
    if (!resource_assignment_id) {
      return NextResponse.json({ error: 'resource_assignment_id required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    await adminPb.collection('resource_assignments').update(resource_assignment_id, {
      seen_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Resource seen error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
