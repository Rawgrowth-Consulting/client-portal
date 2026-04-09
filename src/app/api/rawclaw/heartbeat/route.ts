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

  const { client_slug, machine_id, version, agents } = body;

  if (!machine_id || !version) {
    return NextResponse.json({ error: 'machine_id and version required' }, { status: 400 });
  }

  try {
    // Find existing install record for this machine
    let installRecord: any = null;
    try {
      const existing = await adminPb.collection('rawclaw_installs').getFullList({
        filter: `client_id = "${auth.clientId}" && machine_id = "${machine_id}"`,
      });
      installRecord = existing[0] || null;
    } catch {}

    const now = new Date().toISOString();

    if (installRecord) {
      await adminPb.collection('rawclaw_installs').update(installRecord.id, {
        rawclaw_version: version,
        active_agents: JSON.stringify(agents || []),
        last_heartbeat: now,
        status: 'online',
      });
    } else {
      await adminPb.collection('rawclaw_installs').create({
        client_id: auth.clientId,
        machine_id,
        rawclaw_version: version,
        active_agents: JSON.stringify(agents || []),
        last_heartbeat: now,
        status: 'online',
      });
    }

    return NextResponse.json({ ok: true, received_at: now });
  } catch (err: any) {
    console.error('Heartbeat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
