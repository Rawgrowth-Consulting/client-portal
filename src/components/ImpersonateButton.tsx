'use client';

import { useState } from 'react';

// Starts impersonation from the admin client-detail page. Reason is mandatory
// (FC-06) — collected inline before the POST.
export default function ImpersonateButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/admin/clients/${clientId}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Could not start impersonation');
        setBusy(false);
        return;
      }
      window.location.href = data?.redirect || '/dashboard';
    } catch {
      setError('Network error');
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:border-[rgba(234,179,8,0.5)]"
        style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
      >
        Impersonate
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        aria-label="Impersonation reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && start()}
        placeholder="Reason (required)"
        className="rounded-lg px-3 py-1.5 text-xs outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.92)',
        }}
      />
      <button
        onClick={start}
        disabled={busy}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
        style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}
      >
        {busy ? 'Starting…' : 'Start'}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setError('');
        }}
        className="text-xs"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        Cancel
      </button>
      {error && (
        <span className="text-xs" style={{ color: '#ef4444' }}>
          {error}
        </span>
      )}
    </div>
  );
}
