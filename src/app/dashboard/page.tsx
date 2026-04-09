'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';

export default function DashboardHome() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    setClientId(localStorage.getItem('rg_client_id'));
  }, []);

  const client = useQuery(
    api.clients.get,
    clientId ? { clientId: clientId as Id<'clients'> } : 'skip'
  );

  const calls = useQuery(
    api.scheduledCalls.list,
    clientId ? { clientId: clientId as Id<'clients'> } : 'skip'
  );

  const activity = useQuery(
    api.activityFeed.list,
    clientId ? { clientId: clientId as Id<'clients'>, limit: 5 } : 'skip'
  );

  const healthScore = client?.healthScore || 0;
  const currentMonth = client?.currentMonth || 1;
  const healthColor = healthScore >= 80 ? '#0CBF6A' : healthScore >= 60 ? '#F59E0B' : '#ef4444';

  const upcomingCalls = (calls || []).filter((c) => !c.completed);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Dashboard</p>
        <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Welcome back{client?.name ? `, ${client.name.split(' ')[0]}` : ''}.
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
                {upcomingCalls[0].scheduledAt ? new Date(upcomingCalls[0].scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet scheduled'}
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
          { href: '/dashboard/settings', label: 'Settings', desc: 'Account settings' },
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

      {/* Activity Feed */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">AI Department Activity</h3>
          <Link href="/dashboard/activity" className="text-xs font-medium text-[#0CBF6A] transition-colors hover:text-white">
            View all
          </Link>
        </div>
        {(activity || []).length > 0 ? (
          <div className="space-y-3">
            {(activity || []).map((event) => (
              <div key={event._id} className="flex items-start gap-3 rounded-lg bg-[rgba(255,255,255,0.02)] px-3 py-2.5">
                <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                  event.severity === 'success' ? 'bg-[#0CBF6A]' :
                  event.severity === 'warning' ? 'bg-[#F59E0B]' :
                  event.severity === 'error' ? 'bg-[#ef4444]' : 'bg-[rgba(255,255,255,0.3)]'
                }`} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.title}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.35)]">{event.description}</p>
                </div>
                {event.agentName && (
                  <span className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[10px] font-medium text-[rgba(255,255,255,0.4)]">{event.agentName}</span>
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
