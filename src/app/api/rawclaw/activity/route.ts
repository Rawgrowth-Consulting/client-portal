import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';

async function validateBearerToken(
  adminPb: any,
  authHeader: string | null
): Promise<{ valid: boolean; clientId?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.slice(7);

  // Check setup tokens
  try {
    const setupTokens = await adminPb.collection('rawclaw_setup_tokens').getFullList({
      filter: `token = "${token}"`,
    });
    if (setupTokens.length > 0) {
      return { valid: true, clientId: setupTokens[0].client_id };
    }
  } catch {}

  // Check install tokens (permanent)
  try {
    const installTokens = await adminPb.collection('rawclaw_install_tokens').getFullList({
      filter: `token = "${token}" && active = true`,
    });
    if (installTokens.length > 0) {
      return { valid: true, clientId: installTokens[0].client_id };
    }
  } catch {}

  return { valid: false };
}

// POST /api/rawclaw/activity — rawclaw posts events here
export async function POST(request: NextRequest) {
  const adminPb = await createAdminClient();

  const auth = await validateBearerToken(adminPb, request.headers.get('Authorization'));
  if (!auth.valid || !auth.clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event_type, title, description, agent_name, metadata, severity } = body;

  if (!event_type || !title || !agent_name) {
    return NextResponse.json({ error: 'event_type, title, and agent_name required' }, { status: 400 });
  }

  try {
    const record = await adminPb.collection('activity_events').create({
      client_id: auth.clientId,
      event_type,
      title,
      description: description || null,
      agent_name,
      metadata: JSON.stringify(metadata || {}),
      severity: severity || 'info',
      read_at: null,
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch (err: any) {
    console.error('Activity post error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
