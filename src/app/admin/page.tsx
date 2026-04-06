import { createAdminClient } from '@/lib/pb-server';
import { requireAdmin } from '@/lib/auth';
import { ClientsTable } from './clients-table';

export default async function AdminPage() {
  const { pb } = await requireAdmin();

  let clients: any[] = [];
  try {
    clients = await pb.collection('clients').getFullList({});
  } catch (err) {
    console.error('Failed to fetch clients:', err);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#0CBF6A' }}>Admin</p>
          <h1 className="mt-1 text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>All Clients</h1>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{clients.length} total</p>
      </div>
      <ClientsTable clients={clients as any} />
    </div>
  );
}
