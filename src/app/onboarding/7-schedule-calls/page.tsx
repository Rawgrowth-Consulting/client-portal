'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const CALLS = [
  { id: 'week1', title: 'Week 1 Kickoff', description: 'Meet the team, review your brand profile, set goals for Month 1', duration: '30-45 min', month: 1, week: 1 },
  { id: 'month2', title: 'Month 2 Kickoff', description: 'Review Month 1 results, plan copy & funnels phase', duration: '60 min', month: 2, week: 5 },
  { id: 'month3', title: 'Month 3 Kickoff', description: 'Sales system activation, pipeline review', duration: '60 min', month: 3, week: 9 },
  { id: 'month4', title: 'Month 4 Review & Growth Plan', description: 'Final review, dashboard walkthrough, growth roadmap', duration: '60 min', month: 4, week: 13 },
];

const CALENDLY_BASE = 'https://calendly.com/chriswestt/rawgrowth-discovery';

export default function ScheduleCallsStep() {
  const router = useRouter();
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [clientId, setClientId] = useState<string | null>(null);

  const scheduleCall = useMutation(api.scheduledCalls.schedule);
  const updateStep = useMutation(api.clients.updateOnboardingStep);

  useEffect(() => {
    setClientId(localStorage.getItem('rg_client_id'));
  }, []);

  function handleBook(callId: string) {
    window.open(CALENDLY_BASE, '_blank');
  }

  function toggleBooked(callId: string) {
    if (!clientId) return;
    const call = CALLS.find((c) => c.id === callId);
    if (!call) return;

    setBooked(prev => {
      const next = new Set(prev);
      if (next.has(callId)) next.delete(callId);
      else next.add(callId);
      return next;
    });

    // Save to Convex
    scheduleCall({
      clientId: clientId as Id<'clients'>,
      title: call.title,
      month: call.month,
      week: call.week,
      scheduledAt: Date.now(),
    }).catch(console.error);
  }

  async function handleContinue() {
    if (!clientId) return;
    await updateStep({ clientId: clientId as Id<'clients'>, step: 8 });
    router.push('/onboarding/8-complete');
  }

  async function handleSkip() {
    if (!clientId) return;
    await updateStep({ clientId: clientId as Id<'clients'>, step: 8 });
    router.push('/onboarding/8-complete');
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 7</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Schedule Your Calls</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Book your milestone calls for the 4-month journey. These keep everything on track.</p>

      <div className="space-y-4">
        {CALLS.map((call) => (
          <div key={call.id} className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CBF6A]/20 to-transparent" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-[rgba(12,191,106,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#0CBF6A]">Month {call.month}</span>
                  <span className="text-xs text-[rgba(255,255,255,0.35)]">{call.duration}</span>
                </div>
                <h3 className="mb-1 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>{call.title}</h3>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">{call.description}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {booked.has(call.id) ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-[rgba(12,191,106,0.1)] px-3 py-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
                    <span className="text-xs font-medium text-[#0CBF6A]">Booked</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBook(call.id)}
                    className="rounded-lg bg-[rgba(12,191,106,0.15)] px-4 py-2 text-xs font-medium text-[#0CBF6A] transition-colors hover:bg-[rgba(12,191,106,0.25)]"
                  >
                    Book Call
                  </button>
                )}
                <button
                  onClick={() => toggleBooked(call.id)}
                  className="text-xs text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)]"
                >
                  {booked.has(call.id) ? 'Unmark' : 'Mark as booked'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleSkip} className="text-sm text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]">Book these later</button>
        <button onClick={handleContinue} className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5">
          Continue ({booked.size}/4 booked)
        </button>
      </div>
    </div>
  );
}
