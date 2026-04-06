import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardHome() {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) redirect('/login');

  const userId = pb.authStore.record?.id;
  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
  if (clients.length === 0) redirect('/login');
  const client = clients[0];

  // Get upcoming calls
  let upcomingCalls: any[] = [];
  try {
    upcomingCalls = await adminPb.collection('scheduled_calls').getFullList({
      filter: `client_id = "${client.id}" && completed = false`,
      sort: 'month',
    });
  } catch {}

  // Get recent deliverables
  let deliverables: any[] = [];
  try {
    deliverables = await adminPb.collection('onboarding_steps').getFullList({
      filter: `client_id = "${client.id}" && completed = true`,
      sort: '-completed_at',
    });
  } catch {}

  const healthScore = client.health_score || 85;
  const currentMonth = client.current_month || 1;

  const healthColor = healthScore >= 80 ? '#0CBF6A' : healthScore >= 60 ? '#F59E0B' : '#ef4444';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Dashboard</p>
        <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Welcome back{client.name ? `, ${client.name.split(' ')[0]}` : ''}.
        </h1>
      </div>

      {/* Top row: Health + Month + Calls */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {/* Health Score */}
        <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/30 to-transparent" />
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">Health Score</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-light" style={{ color: healthColor }}>{healthScore}</span>
            <span className="mb-1 text-sm" style={{ color: healthColor }}>/ 100</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full rounded-full transition-all" style={{ width: `${healthScore}%`, backgroundColor: healthColor }} />
          </div>
        </div>

        {/* Current Month */}
        <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/30 to-transparent" />
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">Current Phase</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-[#0CBF6A]">{currentMonth}</span>
            <span className="mb-1 text-sm text-[rgba(255,255,255,0.4)]">/ 4 months</span>
          </div>
          <p className="mt-2 text-xs text-[rgba(255,255,255,0.4)]">
            {currentMonth === 1 ? 'Content + Offer Positioning' : currentMonth === 2 ? 'Copy + Funnels' : currentMonth === 3 ? 'Sales System Activation' : 'Data, KPIs, Optimization'}
          </p>
        </div>

        {/* Next Call */}
        <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/30 to-transparent" />
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">Next Call</p>
          {upcomingCalls.length > 0 ? (
            <>
              <p className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{upcomingCalls[0].title}</p>
              <p className="mt-1 text-xs text-[rgba(255,255,255,0.4)]">
                {upcomingCalls[0].scheduled_at ? new Date(upcomingCalls[0].scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet scheduled'}
              </p>
            </>
          ) : (
            <p className="text-sm text-[rgba(255,255,255,0.4)]">No upcoming calls</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { href: '/dashboard/brand-profile', label: 'Brand Profile', desc: 'View your profile' },
          { href: '/dashboard/resources', label: 'Resources', desc: 'Downloads & tools' },
          { href: '/dashboard/journey', label: 'My Journey', desc: '4-month roadmap' },
          { href: '/dashboard/slack', label: 'Slack Channel', desc: 'Team communication' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-4 transition-colors hover:border-[rgba(12,191,106,0.2)]"
          >
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{link.label}</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">Recent Activity</h3>
        {deliverables.length > 0 ? (
          <div className="space-y-3">
            {deliverables.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
                <span className="text-sm text-[rgba(255,255,255,0.7)]">{d.step_name}</span>
                <span className="ml-auto text-xs text-[rgba(255,255,255,0.3)]">
                  {d.completed_at ? new Date(d.completed_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[rgba(255,255,255,0.4)]">No activity yet. Complete your onboarding to get started.</p>
        )}
      </div>
    </div>
  );
}
