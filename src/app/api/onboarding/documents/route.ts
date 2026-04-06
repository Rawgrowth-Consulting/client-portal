import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';

export async function POST(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = pb.authStore.record?.id;
    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const doc = await adminPb.collection('documents').create({
      client_id: clients[0].id,
      type: type || 'other',
      file: file,
      filename: file.name,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    });

    return NextResponse.json({
      document: {
        id: doc.id,
        filename: file.name,
        type: type,
        size: file.size,
      },
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
