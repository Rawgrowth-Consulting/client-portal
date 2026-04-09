'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export default function WelcomeStep() {
  const router = useRouter();
  const [slackUrl, setSlackUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [messagingChannel, setMessagingChannel] = useState<'telegram' | 'slack' | 'whatsapp'>('slack');
  const [messagingHandle, setMessagingHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const updateStep = useMutation(api.clients.updateOnboardingStep);
  const updateMessaging = useMutation(api.clients.updateMessaging);

  useEffect(() => {
    setClientId(localStorage.getItem('rg_client_id'));
  }, []);

  async function handleComplete() {
    if (!clientId) return;
    setLoading(true);
    try {
      // Save messaging preference
      if (messagingHandle) {
        await updateMessaging({
          clientId: clientId as Id<'clients'>,
          channel: messagingChannel,
          handle: messagingHandle,
        });
      }

      // Advance to step 2
      await updateStep({
        clientId: clientId as Id<'clients'>,
        step: 2,
      });
      router.push('/onboarding/2-questionnaire');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 1</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Welcome to Rawgrowth</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Let's get your AI department set up. This will take about 30 minutes total.</p>

      {/* Video placeholder */}
      <div className="mb-8 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210]">
        <div className="flex aspect-video items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(12,191,106,0.1)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#0CBF6A"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.5)]">Welcome Video</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Messaging channel selection */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <h3 className="mb-2 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>How do you want to talk to your AI agents?</h3>
          <p className="mb-4 text-sm text-[rgba(255,255,255,0.5)]">Pick your preferred messaging channel. Your agents will live here.</p>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {(['telegram', 'slack', 'whatsapp'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setMessagingChannel(ch)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  messagingChannel === ch
                    ? 'border-[#0CBF6A]/50 bg-[rgba(12,191,106,0.08)] text-[#0CBF6A]'
                    : 'border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                {ch === 'telegram' ? 'Telegram' : ch === 'slack' ? 'Slack' : 'WhatsApp'}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={messagingHandle}
            onChange={(e) => setMessagingHandle(e.target.value)}
            placeholder={messagingChannel === 'telegram' ? '@username' : messagingChannel === 'slack' ? 'your-workspace.slack.com' : '+1 234 567 8900'}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
          />
        </div>

        {/* Slack section */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <h3 className="mb-2 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Join our Slack</h3>
          <p className="mb-4 text-sm text-[rgba(255,255,255,0.5)]">Your dedicated channel for direct communication with the Rawgrowth team.</p>
          <a href="https://join.slack.com/t/rawgrowth/shared_invite" target="_blank" rel="noopener noreferrer" className="btn-shine inline-flex items-center gap-2 rounded-lg bg-[#0CBF6A] px-5 py-2.5 text-sm font-medium text-white">
            Join Rawgrowth Slack
          </a>
        </div>

        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <h3 className="mb-2 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Your Slack workspace</h3>
          <p className="mb-4 text-sm text-[rgba(255,255,255,0.5)]">If you have your own Slack workspace, share the details so we can connect there too.</p>

          <div className="space-y-3">
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://yourcompany.slack.com"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
            />
            <input
              type="text"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              placeholder="Channel name (e.g. #rawgrowth-ai)"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleComplete} disabled={loading} className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50">
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
