'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import ReactMarkdown from 'react-markdown';

export default function BrandProfileStep() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const updateStep = useMutation(api.clients.updateOnboardingStep);
  const approveProfile = useMutation(api.brandProfile.approve);
  const regenerateProfile = useMutation(api.brandProfile.regenerate);
  const generateProfile = useAction(api.brandProfile.generate);

  useEffect(() => {
    setClientId(localStorage.getItem('rg_client_id'));
  }, []);

  const profile = useQuery(
    api.brandProfile.get,
    clientId ? { clientId: clientId as Id<'clients'> } : 'skip'
  );

  // Trigger generation if profile exists in "generating" state with empty content
  useEffect(() => {
    if (profile?.status === 'generating' && !profile.content && clientId) {
      generateProfile({ clientId: clientId as Id<'clients'> }).catch(console.error);
    }
  }, [profile?.status, profile?.content, clientId, generateProfile]);

  async function handleApprove() {
    if (!clientId || !profile) return;
    await approveProfile({
      profileId: profile._id,
      approvedBy: clientId,
    });
    await updateStep({
      clientId: clientId as Id<'clients'>,
      step: 4,
    });
    router.push('/onboarding/4-brand-docs');
  }

  async function handleRequestChanges() {
    if (!clientId) return;
    await regenerateProfile({
      clientId: clientId as Id<'clients'>,
      feedback,
    });
    // Trigger regeneration
    generateProfile({ clientId: clientId as Id<'clients'> }).catch(console.error);
    setShowFeedback(false);
    setFeedback('');
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
        <p className="text-[rgba(255,255,255,0.5)]">Loading your brand profile...</p>
      </div>
    );
  }

  if (profile.status === 'generating') {
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
        {profile.content ? (
          <div className="prose-portal">
            <ReactMarkdown>{profile.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-10 w-10 rounded-full bg-[#0CBF6A]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>Your brand profile is being finalized.</p>
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.45)]">Our team is reviewing your questionnaire. You'll see the full profile here shortly. You're good to continue.</p>
          </div>
        )}
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
