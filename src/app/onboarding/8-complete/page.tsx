'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteStep() {
  const router = useRouter();
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (fired) return;
    setFired(true);

    // Fire confetti
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default;

      // First burst
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#0CBF6A', '#ffffff', '#0A9452'] });

      // Second burst after delay
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#0CBF6A', '#ffffff'] });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#0CBF6A', '#ffffff'] });
      }, 250);
    });

    // Mark step 8 complete
    fetch('/api/onboarding/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 8, data: { completed: true } }),
    });
  }, [fired]);

  const TIMELINE = [
    { day: 'Day 1', title: 'Team reviews your questionnaire and brand profile', description: 'Cleo and the team dig into your responses and start calibrating your AI agents.' },
    { day: 'Day 2-3', title: 'AI agents begin training on your brand', description: 'Quilly learns your voice. Ovi maps your competitors. Larry studies your sales process.' },
    { day: 'Day 3-4', title: 'Content OS setup', description: 'Your content pipeline, idea generator, and first batch of content ideas are prepared.' },
    { day: 'Day 5', title: 'First deliverables land in your portal', description: 'Brand profile finalized, first content scripts ready, content calendar drafted.' },
    { day: 'Day 7', title: 'Week 1 Kickoff Call', description: 'Meet the team, review everything, set Month 1 goals. Your AI department is live.' },
  ];

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(12,191,106,0.15)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Onboarding Complete</p>
        <h1 className="mb-2 text-3xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
          You're all set.
        </h1>
        <p className="text-[rgba(255,255,255,0.5)]">Your AI department is being installed. Here's what happens next.</p>
      </div>

      {/* Summary card */}
      <div className="mb-8 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6 text-left">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#0CBF6A]">Setup Summary</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Brand questionnaire submitted',
            'Brand profile generated',
            'Documents uploaded',
            'API keys connected',
            'Software access granted',
            'Milestone calls scheduled',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.6)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6 text-left">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#0CBF6A]">What Happens Next</h3>
        <div className="space-y-4">
          {TIMELINE.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#0CBF6A]/30 bg-[rgba(12,191,106,0.08)]">
                  <span className="text-[10px] font-bold text-[#0CBF6A]">{idx + 1}</span>
                </div>
                {idx < TIMELINE.length - 1 && <div className="mt-1 h-full w-px bg-[rgba(255,255,255,0.06)]" />}
              </div>
              <div className="pb-4">
                <div className="mb-0.5 text-xs font-medium text-[#0CBF6A]">{item.day}</div>
                <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{item.title}</div>
                <div className="text-xs text-[rgba(255,255,255,0.4)]">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="btn-shine rounded-xl bg-[#0CBF6A] px-10 py-4 text-base font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
      >
        Go to My Dashboard
      </button>
    </div>
  );
}
