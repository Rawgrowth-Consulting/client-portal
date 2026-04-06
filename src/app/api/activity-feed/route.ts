import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import { createSupabaseClient, ActivityEvent } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the client record from PocketBase to find the client_id
  const adminPb = await createAdminClient();
  const clients = await adminPb.collection('clients').getFullList({
    filter: `user_id = "${user.id}"`,
  });

  if (clients.length === 0) {
    return NextResponse.json({ error: 'No client record found' }, { status: 404 });
  }

  const client = clients[0];
  const supabase = createSupabaseClient();

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const eventType = searchParams.get('type');

  // Query activity feed from Supabase
  // Match on client PocketBase ID or the demo client
  let query = supabase
    .from('client_activity_feed')
    .select('*')
    .or(`client_id.eq.${client.id},client_id.eq.demo-client`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }

  // Get unread count
  const { count } = await supabase
    .from('client_activity_feed')
    .select('id', { count: 'exact', head: true })
    .or(`client_id.eq.${client.id},client_id.eq.demo-client`)
    .is('read_at', null);

  return NextResponse.json({
    events: data as ActivityEvent[],
    unread_count: count || 0,
    has_more: (data?.length || 0) === limit,
  });
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

  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from('client_activity_feed')
    .update({ read_at: new Date().toISOString() })
    .in('id', event_ids);

  if (error) {
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
