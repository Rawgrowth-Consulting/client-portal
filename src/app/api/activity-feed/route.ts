import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList({
    filter: `user_id = "${user.id}"`,
  });

  if (clients.length === 0) {
    return NextResponse.json({ error: 'No client record found' }, { status: 404 });
  }

  const client = clients[0];

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const eventType = searchParams.get('type');

  try {
    let filter = `client_id = "${client.id}"`;
    if (eventType) {
      filter += ` && event_type = "${eventType}"`;
    }

    const events = await adminPb.collection('activity_events').getList(
      Math.floor(offset / limit) + 1,
      limit,
      {
        filter,
        sort: '-created',
      }
    );

    // Count unread
    const unreadFilter = `client_id = "${client.id}" && read_at = null`;
    let unreadCount = 0;
    try {
      const unread = await adminPb.collection('activity_events').getList(1, 1, {
        filter: unreadFilter,
      });
      unreadCount = unread.totalItems;
    } catch {}

    // Normalize to match ActivityEvent shape
    const normalized = events.items.map((e: any) => ({
      id: e.id,
      client_id: e.client_id,
      event_type: e.event_type,
      title: e.title,
      description: e.description || null,
      agent_name: e.agent_name,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : (e.metadata || {}),
      severity: e.severity || 'info',
      created_at: e.created,
      read_at: e.read_at || null,
    }));

    return NextResponse.json({
      events: normalized,
      unread_count: unreadCount,
      has_more: offset + limit < events.totalItems,
    });
  } catch (err: any) {
    console.error('Activity feed error:', err);
    // Return empty feed on error rather than 500 — collection may not exist yet
    return NextResponse.json({ events: [], unread_count: 0, has_more: false });
  }
}

// Mark events as read
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { event_ids } = body;

  if (!event_ids || !Array.isArray(event_ids)) {
    return NextResponse.json({ error: 'event_ids array required' }, { status: 400 });
  }

  try {
    const adminPb = await createAdminClient();
    const now = new Date().toISOString();

    await Promise.all(
      event_ids.map((id: string) =>
        adminPb.collection('activity_events').update(id, { read_at: now })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Mark read error:', err);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
