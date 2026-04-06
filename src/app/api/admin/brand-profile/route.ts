import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clientId = req.nextUrl.searchParams.get('client_id');
    if (!clientId) {
      return NextResponse.json({ error: 'client_id required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const profiles = await adminPb.collection('brand_profiles').getFullList({
      filter: `client_id = "${clientId}"`,
      sort: '-version',
    });

    return NextResponse.json({
      current: profiles[0] || null,
      versions: profiles,
    });
  } catch (err: any) {
    console.error('Admin brand profile fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { profileId, clientId, client_id, content, action, status } = await req.json();
    const resolvedClientId = clientId || client_id;

    if (!resolvedClientId || !content) {
      return NextResponse.json({ error: 'clientId and content required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    // Determine status from action or explicit status
    let resolvedStatus = status || 'draft';
    if (action === 'approve') resolvedStatus = 'approved';

    if (profileId) {
      // Update existing profile in place
      const updateData: Record<string, any> = { content, status: resolvedStatus };
      if (resolvedStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      }
      const profile = await adminPb.collection('brand_profiles').update(profileId, updateData);
      return NextResponse.json({ profile });
    } else {
      // Create new version
      const existing = await adminPb.collection('brand_profiles').getFullList({
        filter: `client_id = "${resolvedClientId}"`,
        sort: '-version',
      });

      const nextVersion = existing.length > 0 ? (existing[0].version || 1) + 1 : 1;

      const profile = await adminPb.collection('brand_profiles').create({
        client_id: resolvedClientId,
        content,
        version: nextVersion,
        status: resolvedStatus,
        generated_at: new Date().toISOString(),
      });

      return NextResponse.json({ profile });
    }
  } catch (err: any) {
    console.error('Admin brand profile update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { client_id, content, status } = await req.json();

    if (!client_id || !content) {
      return NextResponse.json({ error: 'client_id and content required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    const existing = await adminPb.collection('brand_profiles').getFullList({
      filter: `client_id = "${client_id}"`,
      sort: '-version',
    });

    const nextVersion = existing.length > 0 ? (existing[0].version || 1) + 1 : 1;

    const profile = await adminPb.collection('brand_profiles').create({
      client_id,
      content,
      version: nextVersion,
      status: status || 'draft',
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('Admin brand profile update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
