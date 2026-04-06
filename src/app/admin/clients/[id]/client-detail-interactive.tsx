'use client';

import { useState } from 'react';
import type { Deliverable } from '@/types';

export function ClientDetailInteractive({
  clientId,
  deliverables: initialDeliverables,
  healthScore: initialHealth,
}: {
  clientId: string;
  deliverables: Deliverable[];
  healthScore: number;
}) {
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [healthScore, setHealthScore] = useState(initialHealth);
  const [healthSaving, setHealthSaving] = useState(false);
  const [healthSaved, setHealthSaved] = useState(false);

  async function toggleDeliverable(deliverableId: string, completed: boolean) {
    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === deliverableId
          ? { ...d, completed: !completed, completed_at: !completed ? new Date().toISOString() : null }
          : d
      )
    );

    try {
      await fetch('/api/admin/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deliverableId, completed: !completed }),
      });
    } catch {
      setDeliverables((prev) =>
        prev.map((d) =>
          d.id === deliverableId ? { ...d, completed, completed_at: completed ? d.completed_at : null } : d
        )
      );
    }
  }

  async function saveHealthScore() {
    setHealthSaving(true);
    setHealthSaved(false);
    try {
      await fetch('/api/admin/client/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, health_score: healthScore }),
      });
      setHealthSaved(true);
      setTimeout(() => setHealthSaved(false), 2000);
    } catch {}
    setHealthSaving(false);
  }

  const groupedByMonth = deliverables.reduce(
    (acc, d) => {
      const key = `Month ${d.month}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    },
    {} as Record<string, Deliverable[]>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Deliverables - 2 cols */}
      <div
        className="overflow-hidden rounded-xl lg:col-span-2"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{ background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)' }}
        />
        <div className="p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Deliverables
          </h2>
          {deliverables.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              No deliverables created yet.
            </p>
          ) : (
            <div className="grid gap-4">
              {Object.entries(groupedByMonth).map(([monthLabel, items]) => (
                <div key={monthLabel}>
                  <h3
                    className="mb-2 text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#0CBF6A' }}
                  >
                    {monthLabel}
                  </h3>
                  <div className="grid gap-1">
                    {items.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <button
                          onClick={() => toggleDeliverable(d.id, d.completed)}
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors"
                          style={{
                            borderColor: d.completed ? '#0CBF6A' : 'rgba(255,255,255,0.15)',
                            background: d.completed ? '#0CBF6A' : 'transparent',
                          }}
                        >
                          {d.completed && (
                            <span className="text-[10px] font-bold text-white">{'\u2713'}</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm"
                            style={{
                              color: d.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.92)',
                              textDecoration: d.completed ? 'line-through' : 'none',
                            }}
                          >
                            {d.title}
                          </p>
                          {d.description && (
                            <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {d.description}
                            </p>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          W{d.week}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health Score Editor - 1 col */}
      <div
        className="overflow-hidden rounded-xl self-start"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{ background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)' }}
        />
        <div className="p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Health Score
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={healthScore}
              onChange={(e) => setHealthScore(Number(e.target.value))}
              className="w-20 rounded-lg px-3 py-2 text-center text-lg font-semibold outline-none transition-colors focus:border-[rgba(12,191,106,0.4)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color:
                  healthScore >= 80
                    ? '#0CBF6A'
                    : healthScore >= 60
                      ? '#eab308'
                      : '#ef4444',
              }}
            />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              / 100
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, healthScore))}%`,
                background:
                  healthScore >= 80
                    ? '#0CBF6A'
                    : healthScore >= 60
                      ? '#eab308'
                      : '#ef4444',
              }}
            />
          </div>
          <button
            onClick={saveHealthScore}
            disabled={healthSaving}
            className="btn-shine mt-4 w-full rounded-lg px-4 py-2.5 text-xs font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: '#0CBF6A' }}
          >
            {healthSaving ? 'Saving...' : healthSaved ? 'Saved' : 'Update Health Score'}
          </button>

          <div className="mt-6">
            <h3
              className="mb-3 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Quick Actions
            </h3>
            <div className="grid gap-2">
              <a
                href={`/admin/resources/new?client=${clientId}`}
                className="rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors hover:border-[rgba(12,191,106,0.4)]"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'block',
                }}
              >
                Push Resource
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
