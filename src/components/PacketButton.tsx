'use client';

import { useState } from 'react';

// FC-05: generates + downloads the deployment packet JSON, then refreshes the
// status badge. Disabled until all 10 docs are approved.
export default function PacketButton({ clientId, ready }: { clientId: string; ready: boolean }) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/deployment-packet`);
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === 'docs_not_approved') {
          alert(`Approve all docs first. Missing: ${(data.missing_types || []).join(', ')}`);
        } else {
          alert(data?.error || 'Packet generation failed');
        }
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deployment-packet-${clientId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={busy || !ready}
      title={ready ? 'Generate deployment packet' : 'Approve all 10 docs first'}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
      style={{ background: 'rgba(12,191,106,0.15)', color: '#0CBF6A' }}
    >
      {busy ? 'Generating…' : 'Generate deployment packet'}
    </button>
  );
}
