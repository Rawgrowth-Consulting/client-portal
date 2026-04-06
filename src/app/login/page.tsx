'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send magic link');

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Green radial glow */}
      <div className="pointer-events-none absolute -top-[200px] left-1/2 h-[1000px] w-[1200px] -translate-x-1/2" style={{ background: 'radial-gradient(circle, rgba(12,191,106,.07) 0%, transparent 60%)' }} />

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden" style={{ backgroundImage: 'radial-gradient(rgba(12,191,106,.12) 1px, transparent 1px)', backgroundSize: '20px 20px', WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 10%, transparent 60%)', maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 10%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Client Portal</p>
          <h1 className="text-3xl font-light tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Welcome to <span className="italic text-[#0CBF6A]">Rawgrowth</span>
          </h1>
        </div>

        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/40 to-transparent" style={{ position: 'relative', marginTop: '-32px', marginBottom: '24px' }} />

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(12,191,106,0.1)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
              </div>
              <h2 className="mb-2 text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Check your email</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We sent a login link to <span className="text-white">{email}</span>. Click it to access your portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="mb-4 w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none transition-colors focus:border-[#0CBF6A]/50 focus:ring-1 focus:ring-[#0CBF6A]/30"
              />

              {error && (
                <p className="mb-4 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full rounded-xl bg-[#0CBF6A] px-6 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Only registered Rawgrowth clients can access this portal.
        </p>
      </div>
    </main>
  );
}
