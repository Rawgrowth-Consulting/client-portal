'use client';

import { useState } from 'react';
import { Response } from '@/components/ui/response';
import { DOC_TYPES, DOC_TITLES, type DocType } from '@/lib/docs/types';

export type DocRow = {
  type: DocType;
  title: string;
  content_markdown: string;
  version: number;
  generated_at: string;
  approved_at: string | null;
};

const PANEL = { background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' };

export default function DocsAdmin({ clientId, initial }: { clientId: string; initial: DocRow[] }) {
  const byType = new Map(initial.map((d) => [d.type, d]));
  const [busy, setBusy] = useState<string>('');
  const [viewing, setViewing] = useState<DocRow | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<DocType | null>(null);
  const [feedback, setFeedback] = useState('');

  async function call(url: string, body?: object) {
    setBusy(url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) window.location.reload();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d?.error || 'Action failed');
      }
    } finally {
      setBusy('');
    }
  }

  const generated = initial.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Profile Documents
        </h1>
        <button
          onClick={() => call(`/api/admin/clients/${clientId}/docs/generate`)}
          disabled={!!busy}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          style={{ background: 'rgba(12,191,106,0.15)', color: '#0CBF6A' }}
        >
          {busy.endsWith('/generate') ? 'Generating…' : generated ? 'Regenerate all' : 'Generate all 10'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {DOC_TYPES.map((type) => {
          const doc = byType.get(type);
          const approved = !!doc?.approved_at;
          return (
            <div key={type} className="rounded-xl p-5" style={PANEL}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {DOC_TITLES[type]}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {doc ? `v${doc.version} · ${approved ? 'approved' : 'pending review'}` : 'not generated'}
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    background: approved ? 'rgba(12,191,106,0.12)' : 'rgba(234,179,8,0.12)',
                    color: approved ? '#0CBF6A' : '#eab308',
                  }}
                >
                  {doc ? (approved ? 'approved' : 'review') : 'missing'}
                </span>
              </div>

              {doc && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setViewing(doc)}
                    className="rounded-md px-2.5 py-1 text-xs"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => call(`/api/admin/clients/${clientId}/docs/${type}/approve`)}
                    disabled={approved || !!busy}
                    className="rounded-md px-2.5 py-1 text-xs disabled:opacity-40"
                    style={{ background: 'rgba(12,191,106,0.15)', color: '#0CBF6A' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackFor(type);
                      setFeedback('');
                    }}
                    className="rounded-md px-2.5 py-1 text-xs"
                    style={{ border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}
                  >
                    Regenerate
                  </button>
                </div>
              )}

              {feedbackFor === type && (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    aria-label="Regeneration feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What should change?"
                    rows={3}
                    className="rounded-md px-2 py-1.5 text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => call(`/api/admin/clients/${clientId}/docs/regenerate`, { type, feedback })}
                      disabled={!!busy}
                      className="rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                      style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}
                    >
                      Submit
                    </button>
                    <button onClick={() => setFeedbackFor(null)} className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-8"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div className="w-full max-w-3xl rounded-xl p-6" style={PANEL}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {viewing.title} <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>v{viewing.version}</span>
              </h2>
              <button onClick={() => setViewing(null)} className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Close
              </button>
            </div>
            <Response>{viewing.content_markdown}</Response>
          </div>
        </div>
      )}
    </div>
  );
}
