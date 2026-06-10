'use client';

import { useState } from 'react';

// FC-03: persistent banner shown whenever an admin is impersonating a client.
// Yellow to match existing "warning" tones; sticky across dashboard + admin.
export default function ImpersonationBanner({ targetName }: { targetName: string }) {
  const [exiting, setExiting] = useState(false);

  async function exit() {
    setExiting(true);
    try {
      const res = await fetch('/admin/impersonation/exit', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      window.location.href = data?.redirect || '/admin';
    } catch {
      setExiting(false);
    }
  }

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2"
      style={{ background: 'rgba(234,179,8,0.14)', borderBottom: '1px solid rgba(234,179,8,0.4)' }}
    >
      <span className="text-sm font-medium" style={{ color: '#eab308' }}>
        Viewing as <strong>{targetName}</strong> (impersonation)
      </span>
      <button
        onClick={exit}
        disabled={exiting}
        className="rounded-md px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
        style={{ background: 'rgba(234,179,8,0.2)', color: '#eab308' }}
      >
        {exiting ? 'Exiting…' : 'Exit impersonation'}
      </button>
    </div>
  );
}
