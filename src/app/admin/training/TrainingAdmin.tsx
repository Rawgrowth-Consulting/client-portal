'use client';

import { useState } from 'react';

type Source = { id: string; name: string; category: string; source_type: string; status: string };
type Material = { id: string; title: string; summary: string | null; training_source_id: string | null; tags: string[]; business_types: string[]; use_cases: string[] };

const PANEL = { background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' };
const INPUT = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)' };
const CATEGORIES = ['sales', 'copywriting', 'marketing', 'offer_building', 'content', 'agency_ops', 'ecommerce', 'client_success', 'general'];

export default function TrainingAdmin({ sources, materials }: { sources: Source[]; materials: Material[] }) {
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState({ name: '', category: 'sales', source_type: 'manual', source_url: '' });
  const [mat, setMat] = useState({ title: '', summary: '', training_source_id: '', content_markdown: '', tags: '', business_types: '', use_cases: '' });

  async function post(url: string, body: object) {
    setBusy(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert(d?.error || 'Failed'); return false; }
      window.location.reload();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sources */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Sources ({sources.length})</h2>
        <div className="mb-4 rounded-xl p-4" style={PANEL}>
          <input aria-label="Source name" placeholder="Name" value={src.name} onChange={(e) => setSrc({ ...src, name: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <select aria-label="Category" value={src.category} onChange={(e) => setSrc({ ...src, category: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Source type" value={src.source_type} onChange={(e) => setSrc({ ...src, source_type: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT}>
            {['manual', 'google_drive', 'course_notes', 'framework'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input aria-label="Source URL" placeholder="Source URL (optional)" value={src.source_url} onChange={(e) => setSrc({ ...src, source_url: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <button onClick={() => post('/api/admin/training/sources', src)} disabled={busy || !src.name} className="rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(12,191,106,0.15)', color: '#0CBF6A' }}>Add source</button>
        </div>
        {sources.map((s) => (
          <div key={s.id} className="mb-2 rounded-lg px-3 py-2 text-xs" style={PANEL}>
            <span style={{ color: 'rgba(255,255,255,0.92)' }}>{s.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {s.category} · {s.source_type} · {s.status}</span>
          </div>
        ))}
      </div>

      {/* Materials */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Materials ({materials.length})</h2>
        <div className="mb-4 rounded-xl p-4" style={PANEL}>
          <input aria-label="Material title" placeholder="Title" value={mat.title} onChange={(e) => setMat({ ...mat, title: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <select aria-label="Material source" value={mat.training_source_id} onChange={(e) => setMat({ ...mat, training_source_id: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT}>
            <option value="">(no source)</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input aria-label="Summary" placeholder="Summary" value={mat.summary} onChange={(e) => setMat({ ...mat, summary: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <textarea aria-label="Content" placeholder="Content (markdown)" rows={4} value={mat.content_markdown} onChange={(e) => setMat({ ...mat, content_markdown: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <input aria-label="Tags" placeholder="tags (comma-sep)" value={mat.tags} onChange={(e) => setMat({ ...mat, tags: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <input aria-label="Business types" placeholder="business_types (comma-sep)" value={mat.business_types} onChange={(e) => setMat({ ...mat, business_types: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <input aria-label="Use cases" placeholder="use_cases (comma-sep)" value={mat.use_cases} onChange={(e) => setMat({ ...mat, use_cases: e.target.value })} className="mb-2 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={INPUT} />
          <button onClick={() => post('/api/admin/training/materials', mat)} disabled={busy || !mat.title || !mat.content_markdown} className="rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(12,191,106,0.15)', color: '#0CBF6A' }}>Add material</button>
        </div>
        {materials.map((m) => (
          <div key={m.id} className="mb-2 rounded-lg px-3 py-2 text-xs" style={PANEL}>
            <span style={{ color: 'rgba(255,255,255,0.92)' }}>{m.title}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {(m.business_types || []).join(', ') || 'no types'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
