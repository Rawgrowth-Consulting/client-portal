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

    // Get client record
    const clients = await adminPb.collection('clients').getFullList({
      filter: `user_id = "${userId}"`,
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clients[0];

    // Fetch all data in parallel
    const [upcomingCalls, recentDeliverables, unseenResources] = await Promise.all([
      // Upcoming scheduled calls (not completed, sorted by month)
      adminPb.collection('scheduled_calls').getFullList({
        filter: `client_id = "${client.id}" && completed = false`,
        sort: 'month',
      }),

      // Recent completed deliverables (last 3)
      adminPb.collection('deliverables').getList(1, 3, {
        filter: `client_id = "${client.id}" && completed = true`,
        sort: '-completed_at',
      }),

      // Unseen resource count
      adminPb.collection('resource_assignments').getFullList({
        filter: `client_id = "${client.id}" && seen_at = null`,
      }),
    ]);

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        status: client.status,
        health_score: client.health_score,
        current_month: client.current_month,
        onboarding_step: client.onboarding_step,
        plan: client.plan,
      },
      upcoming_calls: upcomingCalls,
      recent_deliverables: recentDeliverables.items,
      unseen_resource_count: unseenResources.length,
    });
  } catch (err: any) {
    console.error('Dashboard home error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
