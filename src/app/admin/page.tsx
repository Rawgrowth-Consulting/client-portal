import { requireAdmin } from '@/lib/auth';
import { convex } from '@/lib/convex-server';
import { api } from '../../../convex/_generated/api';
import { ClientsTable } from './clients-table';

export default async function AdminPage() {
  await requireAdmin();

  let clients: any[] = [];
  try {
    const raw = await convex.query(api.clients.listAll, {});
    // Normalize Convex camelCase → snake_case expected by ClientsTable
    clients = raw.map((c: any) => ({
      ...c,
      id: c._id,
      health_score: c.healthScore ?? 0,
      current_month: c.currentMonth ?? 1,
      onboarding_step: c.onboardingStep ?? 1,
      onboarding_completed_at: c.onboardingCompletedAt ?? null,
      slack_channel_id: c.slackChannelId ?? null,
    }));
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
