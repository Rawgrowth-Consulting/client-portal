'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types';

type SortKey = 'name' | 'company' | 'onboarding_step' | 'health_score' | 'current_month' | 'updated' | 'status';
type SortDir = 'asc' | 'desc';

function HealthBadge({ score }: { score: number }) {
  let bg = 'rgba(239,68,68,0.15)';
  let color = '#ef4444';
  if (score >= 80) {
    bg = 'rgba(12,191,106,0.15)';
    color = '#0CBF6A';
  } else if (score >= 60) {
    bg = 'rgba(234,179,8,0.15)';
    color = '#eab308';
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(12,191,106,0.12)', color: '#0CBF6A' },
    onboarding: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
    churned: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  };
  const s = styles[status] || styles.onboarding;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  direction,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-white"
      style={{ color: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}
      onClick={() => onClick(sortKey)}
    >
      {label}
      {active && (
        <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </th>
  );
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    );

    result.sort((a, b) => {
      let aVal: string | number = a[sortKey] as string | number;
      let bVal: string | number = b[sortKey] as string | number;

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, search, sortKey, sortDir]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or company..."
          className="w-full max-w-sm rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[rgba(12,191,106,0.4)]"
          style={{
            background: '#0A1210',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.92)',
          }}
        />
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
          }}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <SortHeader label="Name" sortKey="name" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Company" sortKey="company" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Onboarding" sortKey="onboarding_step" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Health" sortKey="health_score" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Month" sortKey="current_month" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Last Activity" sortKey="updated" current={sortKey} direction={sortDir} onClick={handleSort} />
                <SortHeader label="Status" sortKey="status" current={sortKey} direction={sortDir} onClick={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {search ? 'No clients match that search.' : 'No clients yet.'}
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/clients/${c.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(12,191,106,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {c.company}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {c.onboarding_completed_at ? (
                      <span style={{ color: '#0CBF6A' }}>Complete</span>
                    ) : (
                      `Step ${c.onboarding_step} / 8`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <HealthBadge score={c.health_score} />
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {c.current_month}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {formatDate(c.updated)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
