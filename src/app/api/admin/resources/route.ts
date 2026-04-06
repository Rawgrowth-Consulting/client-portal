import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

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

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const externalUrl = formData.get('external_url') as string;
    const targetAll = formData.get('target_all') === 'true';
    const clientIdsRaw = formData.get('client_ids') as string;
    const file = formData.get('file') as File | null;

    if (!title || !type) {
      return NextResponse.json({ error: 'title and type required' }, { status: 400 });
    }

    const adminPb = await createAdminClient();

    // Create resource record
    const resourceData: Record<string, any> = {
      title,
      description: description || '',
      type,
      external_url: externalUrl || '',
    };

    // If file upload, attach it
    let resource;
    if (file) {
      const resourceForm = new FormData();
      for (const [key, val] of Object.entries(resourceData)) {
        resourceForm.append(key, val);
      }
      resourceForm.append('file', file);
      resource = await adminPb.collection('resources').create(resourceForm);
    } else {
      resource = await adminPb.collection('resources').create(resourceData);
    }

    // Determine target clients
    let targetClients: any[] = [];
    if (targetAll) {
      targetClients = await adminPb.collection('clients').getFullList({
        filter: 'status = "active"',
      });
    } else if (clientIdsRaw) {
      const clientIds: string[] = JSON.parse(clientIdsRaw);
      targetClients = await Promise.all(
        clientIds.map((cid) => adminPb.collection('clients').getOne(cid))
      );
    }

    // Create assignments and notify via Slack
    const assignments = [];
    for (const client of targetClients) {
      const assignment = await adminPb.collection('resource_assignments').create({
        resource_id: resource.id,
        client_id: client.id,
        seen_at: null,
      });
      assignments.push(assignment);

      // Send Slack notification to client channel
      if (client.slack_channel_id) {
        await sendSlackMessage(
          client.slack_channel_id,
          `New resource available: ${title}${description ? ' -- ' + description : ''}`
        );
      }
    }

    return NextResponse.json({
      resource,
      assignments_created: assignments.length,
    });
  } catch (err: any) {
    console.error('Admin resource push error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
