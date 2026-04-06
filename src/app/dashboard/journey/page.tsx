import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import type { Deliverable } from '@/types';
import JourneyTimeline from './JourneyTimeline';

const MONTH_PLAN: Record<number, { label: string; focus: string }> = {
  1: { label: 'Month 1', focus: 'Content + Offer' },
  2: { label: 'Month 2', focus: 'Copy + Funnels' },
  3: { label: 'Month 3', focus: 'Sales System' },
  4: { label: 'Month 4', focus: 'Data + KPIs' },
};

export default async function JourneyPage() {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) redirect('/login');

  const userId = pb.authStore.record?.id;
  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList({
    filter: `user_id = "${userId}"`,
  });
  const client = clients[0];
  if (!client) redirect('/login');

  let deliverables: Deliverable[] = [];
  try {
    const records = await adminPb.collection('deliverables').getFullList({
      filter: `client_id = "${client.id}"`,
      sort: 'month,week',
    });
    deliverables = records as unknown as Deliverable[];
  } catch {}

  const currentMonth = client.current_month || 1;
  const now = new Date();
  const startDate = new Date(client.onboarding_completed_at || client.created);
  const weeksSinceStart = Math.max(
    1,
    Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  );
  const currentWeek = Math.min(weeksSinceStart, 4);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#0CBF6A' }}>
          Your Journey
        </p>
        <h2 className="mt-1 text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          4-Month Delivery Plan
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Track every deliverable across your engagement. Green checkmarks are set by your team as work
          completes.
        </p>
      </div>

      <JourneyTimeline
        deliverables={JSON.parse(JSON.stringify(deliverables))}
        monthPlan={MONTH_PLAN}
        currentMonth={currentMonth}
        currentWeek={currentWeek}
      />
    </div>
  );
}
