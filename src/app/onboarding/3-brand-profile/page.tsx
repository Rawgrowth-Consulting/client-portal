'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function BrandProfileStep() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/onboarding/brand-profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    loadProfile();
    // Poll while generating
    const interval = setInterval(loadProfile, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleApprove() {
    await fetch('/api/onboarding/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 3, data: { approved: true } }),
    });
    router.push('/onboarding/4-brand-docs');
  }

  async function handleRequestChanges() {
    await fetch('/api/onboarding/brand-profile/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    setShowFeedback(false);
    setFeedback('');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
        <p className="text-[rgba(255,255,255,0.5)]">Loading your brand profile...</p>
      </div>
    );
  }

  if (profile?.status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
        <h2 className="mb-2 text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Generating Your Brand Profile</h2>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">Our AI is analyzing your questionnaire responses. This takes about 30 seconds.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 3</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Your Brand Profile</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Review the AI-generated profile based on your questionnaire. This drives all content and strategy.</p>

      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6 md:p-8">
        <div className="prose-portal">
          <ReactMarkdown>{profile?.content || 'No profile generated yet.'}</ReactMarkdown>
        </div>
      </div>

      {showFeedback && (
        <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <h3 className="mb-2 text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Request Changes</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe what needs to change..."
            rows={4}
            className="mb-3 w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-white placeholder-[rgba(255,255,255,0.3)] outline-none focus:border-[#0CBF6A]/50"
          />
          <div className="flex gap-2">
            <button onClick={handleRequestChanges} className="rounded-lg bg-[#0CBF6A] px-4 py-2 text-sm font-medium text-white">Send Feedback</button>
            <button onClick={() => setShowFeedback(false)} className="rounded-lg border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-[rgba(255,255,255,0.6)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setShowFeedback(true)}
          className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-transparent px-6 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.7)] transition-colors hover:border-[#0CBF6A]/40 hover:text-white"
        >
          Request Changes
        </button>
        <button
          onClick={handleApprove}
          className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5"
        >
          Looks Good, Continue
        </button>
      </div>
    </div>
  );
}
