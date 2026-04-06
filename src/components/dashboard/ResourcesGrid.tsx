'use client';

import { useState } from 'react';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'update' | 'doc' | 'tool';
  file: string;
  external_url: string;
  pushed_at: string;
  seen_at: string | null;
  assignment_id: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  skill: { label: 'Skill', color: '#0CBF6A', bg: 'rgba(12,191,106,0.1)' },
  update: { label: 'Update', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  doc: { label: 'Doc', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  tool: { label: 'Tool', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

export default function ResourcesGrid({ resources }: { resources: ResourceItem[] }) {
  const [items, setItems] = useState<ResourceItem[]>(resources);
  const [filter, setFilter] = useState<string>('all');

  const typeOptions = ['all', 'skill', 'update', 'doc', 'tool'];

  async function markSeen(assignmentId: string | null) {
    if (!assignmentId) return;
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_assignment_id: assignmentId }),
      });
      setItems((prev) =>
        prev.map((r) =>
          r.assignment_id === assignmentId ? { ...r, seen_at: new Date().toISOString() } : r
        )
      );
    } catch {}
  }

  function handleResourceClick(resource: ResourceItem) {
    if (!resource.seen_at && resource.assignment_id) {
      markSeen(resource.assignment_id);
    }
  }

  const filtered = filter === 'all' ? items : items.filter((r) => r.type === filter);

  if (items.length === 0) {
    return (
      <div
        className="relative overflow-hidden rounded-xl p-12 text-center"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          No resources yet
        </p>
        <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Your team will push frameworks, SOPs, and tools here as your engagement progresses.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div
        className="mb-6 inline-flex gap-1 rounded-lg p-1"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {typeOptions.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="rounded-md px-3.5 py-1.5 text-xs font-medium capitalize transition-all"
            style={{
              background: filter === t ? 'rgba(12,191,106,0.1)' : 'transparent',
              color: filter === t ? '#0CBF6A' : 'rgba(255,255,255,0.45)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No {filter} resources found.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((resource) => {
            const typeConf = TYPE_CONFIG[resource.type] || TYPE_CONFIG.doc;
            const isNew = !resource.seen_at;
            const hasFile = !!resource.file;
            const hasLink = !!resource.external_url;

            return (
              <div
                key={resource.id}
                className="group relative overflow-hidden rounded-xl p-5 transition-all"
                style={{
                  background: '#0A1210',
                  border: isNew
                    ? '1px solid rgba(12,191,106,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {isNew && (
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background:
                        'linear-gradient(to right, transparent, rgba(12,191,106,0.4), transparent)',
                    }}
                  />
                )}

                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                      style={{ background: typeConf.bg, color: typeConf.color }}
                    >
                      {typeConf.label}
                    </span>
                    {isNew && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: '#0CBF6A', color: '#fff' }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  {resource.pushed_at && (
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(resource.pushed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {resource.title}
                </h3>

                {resource.description && (
                  <p
                    className="mb-4 line-clamp-2 text-xs leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {resource.description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2">
                  {hasFile && (
                    <a
                      href={resource.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleResourceClick(resource)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: 'rgba(12,191,106,0.08)',
                        color: '#0CBF6A',
                        border: '1px solid rgba(12,191,106,0.15)',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </a>
                  )}
                  {hasLink && (
                    <a
                      href={resource.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleResourceClick(resource)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Open
                    </a>
                  )}
                  {!hasFile && !hasLink && (
                    <span className="text-[10px] italic" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No attachment
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
