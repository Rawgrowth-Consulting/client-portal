'use client';

import { useEffect, useState } from 'react';
import { Clock, FileCheck, DollarSign, Bot, Info } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ImpactPayload } from '@/app/api/dashboard/impact/route';

const STAT_TILES: Array<{
  key: keyof ImpactPayload['monthly'];
  label: string;
  format: (n: number) => string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'hoursSaved', label: 'Hours saved · this month', format: (n) => `${n.toLocaleString()}`, icon: Clock },
  { key: 'outputsShipped', label: 'Outputs shipped', format: (n) => `${n.toLocaleString()}`, icon: FileCheck },
  { key: 'dollarsInfluenced', label: '$ influenced', format: (n) => `$${n.toLocaleString()}`, icon: DollarSign },
  { key: 'agentsLive', label: 'Agents live', format: (n) => `${n}`, icon: Bot },
];

export default function ImpactPage() {
  const [data, setData] = useState<ImpactPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/impact')
      .then((r) => r.json())
      .then((d: ImpactPayload) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-2 py-2">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0CBF6A]">
          Impact
        </p>
        <h1 className="mt-2 text-2xl font-medium text-white/95">
          Your AI Department — Impact
        </h1>
        <p className="mt-1.5 text-sm text-white/55">
          Hours back, outputs shipped, and dollars moved by your agents. Streams live from your AI department.
        </p>
      </header>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_TILES.map((tile) => {
          const Icon = tile.icon;
          const value = data ? tile.format(data.monthly[tile.key]) : '—';
          return (
            <div
              key={tile.key}
              className="rg-fade-in rounded-xl p-4"
              style={{
                background: '#0A1210',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(12,191,106,0.10)]">
                <Icon className="h-3.5 w-3.5 text-[#0CBF6A]" />
              </div>
              <p className="text-[28px] font-medium leading-none text-white/92">{value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-white/45">{tile.label}</p>
            </div>
          );
        })}
      </section>

      {/* Trend chart */}
      <section
        className="mt-4 rounded-xl p-5"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white/85">Hours saved · trend (30 days)</p>
          {data && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: data.dataReady ? 'rgba(12,191,106,0.12)' : 'rgba(234,179,8,0.10)',
                color: data.dataReady ? '#0CBF6A' : '#facc15',
              }}
            >
              {data.dataReady ? 'live' : 'awaiting first agent'}
            </span>
          )}
        </div>
        <div className="h-[220px] w-full">
          {data && data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0CBF6A" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0CBF6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0A1210',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="hoursSaved" stroke="#0CBF6A" fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-sm text-white/55">
                {loading ? 'Loading…' : 'Your trend lights up the moment the first agent ships work.'}
              </p>
              <p className="mt-1 max-w-md text-[12px] text-white/35">
                {!loading && data?.note}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Per-agent breakdown */}
      <section
        className="mt-4 rounded-xl p-5"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="mb-3 text-sm font-medium text-white/85">Per-agent breakdown</p>
        {data && data.perAgent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <th className="px-2 py-1.5 font-medium">Agent</th>
                  <th className="px-2 py-1.5 font-medium">Function</th>
                  <th className="px-2 py-1.5 font-medium">Status</th>
                  <th className="px-2 py-1.5 font-medium">Hours saved</th>
                  <th className="px-2 py-1.5 font-medium">Outputs shipped</th>
                </tr>
              </thead>
              <tbody>
                {data.perAgent.map((a) => (
                  <tr
                    key={a.name}
                    style={{
                      color: 'rgba(255,255,255,0.78)',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <td className="px-2 py-2 font-medium">{a.name}</td>
                    <td className="px-2 py-2 text-white/55">{a.function}</td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                        style={{
                          background:
                            a.status === 'live'
                              ? 'rgba(12,191,106,0.12)'
                              : a.status === 'building'
                                ? 'rgba(234,179,8,0.10)'
                                : 'rgba(255,255,255,0.05)',
                          color:
                            a.status === 'live'
                              ? '#0CBF6A'
                              : a.status === 'building'
                                ? '#facc15'
                                : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{a.hoursSavedMonth.toLocaleString()}</td>
                    <td className="px-2 py-2">{a.outputsShippedMonth.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-white/40">
            No agents live yet. Each agent will appear here as it ships into production.
          </p>
        )}
      </section>

      {/* How this works */}
      <section
        className="mt-4 flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-white/80">How impact is measured</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/55">
            Every job your agents run is logged with the time it would have taken a human, the
            output produced, and any $ moved. This view aggregates that data — no manual reporting,
            no inflation. You always know what your AI department is actually doing.
          </p>
        </div>
      </section>
    </div>
  );
}
