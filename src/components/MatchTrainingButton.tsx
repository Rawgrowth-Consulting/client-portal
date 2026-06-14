'use client';

import { useState } from 'react';

// F-005: admin triggers training match for a client. Shows the empty-match CTA.
export default function MatchTrainingButton({ clientId }: { clientId: string }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/training/match`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert(d?.error || 'Match failed'); return; }
      if (d.emptyMatch) alert('No matches — review training tags / add materials for this client type.');
      else alert(`Assigned ${d.assigned} training materials (top score ${Number(d.topScore).toFixed(2)}).`);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
      style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
    >
      {busy ? 'Matching…' : 'Match training'}
    </button>
  );
}
