import { createAdminClient } from '@/lib/pb-server';
import { requireAdmin } from '@/lib/auth';
import type { Client } from '@/types';
import { ClientsTable } from './clients-table';

export default async function AdminPage() {
  await requireAdmin();
  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList<Client>({
    sort: '-updated',
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#0CBF6A' }}
          >
            Admin
          </p>
          <h1
            className="mt-1 text-2xl font-medium"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            All Clients
          </h1>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {clients.length} total
        </p>
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}
