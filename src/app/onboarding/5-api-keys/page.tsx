'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z', description: 'Business account access token or Graph API key' },
  { id: 'youtube', name: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', description: 'YouTube Data API key or OAuth token' },
  { id: 'twitter', name: 'Twitter / X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', description: 'API key and secret for posting and analytics' },
  { id: 'calendly', name: 'Calendly', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z', description: 'Personal access token for booking integration' },
  { id: 'stripe', name: 'Stripe', icon: 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.891 5.527C5.175 22.99 8.385 24 11.714 24c2.588 0 4.737-.657 6.263-1.868 1.682-1.322 2.523-3.274 2.523-5.627 0-4.108-2.577-5.764-6.524-7.354z', description: 'Secret key for payment tracking (sk_live_...)' },
  { id: 'crm', name: 'CRM', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', description: 'GoHighLevel, Close, or HubSpot API key' },
  { id: 'email', name: 'Email Platform', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6', description: 'API key for your email marketing platform' },
  { id: 'other', name: 'Other', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', description: 'Any other API keys or integrations' },
];

export default function ApiKeysStep() {
  const router = useRouter();
  const [keys, setKeys] = useState<Record<string, { name: string; value: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  async function handleSubmitKey(platformId: string) {
    const key = keys[platformId];
    if (!key?.value) return;

    setSubmitting(platformId);
    try {
      const res = await fetch('/api/onboarding/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformId,
          key_name: key.name || platformId,
          key_value: key.value,
        }),
      });

      if (res.ok) {
        setSubmitted(prev => new Set(prev).add(platformId));
        setKeys(prev => ({ ...prev, [platformId]: { name: key.name, value: '' } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleContinue() {
    await fetch('/api/onboarding/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 5, data: { platforms_connected: Array.from(submitted) } }),
    });
    router.push('/onboarding/6-software-access');
  }

  async function handleSkip() {
    await fetch('/api/onboarding/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 5, data: { skipped: true } }),
    });
    router.push('/onboarding/6-software-access');
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 5</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>API Keys & Integrations</h1>
      <p className="mb-4 text-[rgba(255,255,255,0.5)]">Connect your platforms so our AI agents can access your data and post on your behalf.</p>
      <div className="mb-8 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(12,191,106,0.04)] px-4 py-3">
        <p className="text-xs text-[rgba(255,255,255,0.5)]">
          <span className="font-medium text-[#0CBF6A]">Security note:</span> Your full keys are sent directly to our team via secure channel and are never stored in this portal. Only the last 4 characters are saved as a reference.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <div key={platform.id} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.03)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d={platform.icon}/></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{platform.name}</h3>
                {submitted.has(platform.id) && (
                  <span className="text-xs text-[#0CBF6A]">Connected</span>
                )}
              </div>
            </div>
            <p className="mb-3 text-xs text-[rgba(255,255,255,0.35)]">{platform.description}</p>

            {submitted.has(platform.id) ? (
              <div className="flex items-center gap-2 rounded-lg bg-[rgba(12,191,106,0.08)] px-3 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
                <span className="text-xs text-[#0CBF6A]">Key submitted securely</span>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={keys[platform.id]?.value || ''}
                  onChange={(e) => setKeys(prev => ({ ...prev, [platform.id]: { name: prev[platform.id]?.name || '', value: e.target.value } }))}
                  placeholder="Paste your API key"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
                />
                <button
                  onClick={() => handleSubmitKey(platform.id)}
                  disabled={!keys[platform.id]?.value || submitting === platform.id}
                  className="w-full rounded-lg bg-[rgba(12,191,106,0.15)] px-3 py-2 text-xs font-medium text-[#0CBF6A] transition-colors hover:bg-[rgba(12,191,106,0.25)] disabled:opacity-30"
                >
                  {submitting === platform.id ? 'Submitting...' : 'Submit Key'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleSkip} className="text-sm text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]">Skip for now</button>
        <button onClick={handleContinue} className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5">
          Continue
        </button>
      </div>
    </div>
  );
}
