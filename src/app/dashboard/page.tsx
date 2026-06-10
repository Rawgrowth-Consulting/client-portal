'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import SetupChecklist, { type SetupChecklistData } from '@/components/dashboard/SetupChecklist';

export default function DashboardHome() {
  const { data: session } = useSession();
  const [client, setClient] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<SetupChecklistData | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchData() {
      // All DB access is server-side (/api/dashboard/summary enforces the session
      // and uses the service role). The browser never holds a privileged key.
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) return;
      const data = await res.json();

      if (data.client) setClient(data.client);
      if (data.calls) setCalls(data.calls);
      if (data.activity) setActivity(data.activity);
      setChecklist({ client: data.client, ...data.checklist });
    }

    fetchData();
  }, [session?.user?.id]);

  const healthScore = client?.health_score || 0;
  const currentMonth = client?.current_month || 1;
  const healthColor = healthScore >= 80 ? '#0CBF6A' : healthScore >= 60 ? '#F59E0B' : '#ef4444';

  const upcomingCalls = calls.filter((c) => !c.completed);

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}.`}
      />

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

      {/* Setup Checklist */}
      <div className="mb-6">
        <SetupChecklist data={checklist} />
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">AI Department Activity</h3>
          <Link href="/dashboard/activity" className="text-xs font-medium text-[#0CBF6A] transition-colors hover:text-white">
            View all
          </Link>
        </div>
        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2.5">
                <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                  event.severity === 'success' ? 'bg-[#0CBF6A]' :
                  event.severity === 'warning' ? 'bg-[#F59E0B]' :
                  event.severity === 'error' ? 'bg-[#ef4444]' : 'bg-[rgba(255,255,255,0.3)]'
                }`} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.title}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.35)]">{event.description}</p>
                </div>
                {event.agent_name && (
                  <span className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[10px] font-medium text-[rgba(255,255,255,0.4)]">{event.agent_name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[rgba(255,255,255,0.35)]">No activity yet. Your AI department will start showing updates here once it's active.</p>
        )}
      </div>
    </div>
  );
}
