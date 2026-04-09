'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const PLATFORMS = [
  {
    id: 'instagram_bm',
    name: 'Instagram Business Manager',
    steps: ['Go to business.facebook.com/settings', 'Click "People"', 'Add chris@rawgrowth.ai as Admin', 'Confirm the invitation'],
  },
  {
    id: 'youtube_studio',
    name: 'YouTube Studio',
    steps: ['Go to studio.youtube.com', 'Click Settings > Permissions', 'Click "Invite" and add chris@rawgrowth.ai', 'Set role to "Manager"'],
  },
  {
    id: 'crm',
    name: 'CRM (GoHighLevel / Close / HubSpot)',
    steps: ['Go to your CRM admin settings', 'Find "Team" or "Users" section', 'Add chris@rawgrowth.ai with admin or manager access', 'Share any sub-account or workspace IDs'],
  },
  {
    id: 'drive_notion',
    name: 'Google Drive / Notion',
    steps: ['Create a shared folder for Rawgrowth collaboration', 'Share the folder with chris@rawgrowth.ai', 'Set permissions to "Editor"', 'Share the link in your Slack channel'],
  },
  {
    id: 'analytics',
    name: 'Google Analytics',
    steps: ['Go to admin.google.com or analytics.google.com', 'Navigate to Admin > Account Access', 'Add chris@rawgrowth.ai', 'Set role to "Analyst" or "Editor"'],
  },
  {
    id: 'other',
    name: 'Other Tools',
    steps: ['Identify any other tools flagged in your questionnaire', 'Add chris@rawgrowth.ai as a team member', 'Share access details in your Slack channel'],
  },
];

export default function SoftwareAccessStep() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(PLATFORMS[0].id);
  const [clientId, setClientId] = useState<string | null>(null);

  const confirmAccess = useMutation(api.softwareAccess.confirm);
  const updateStep = useMutation(api.clients.updateOnboardingStep);

  useEffect(() => {
    setClientId(localStorage.getItem('rg_client_id'));
  }, []);

  function toggleConfirm(id: string) {
    if (!clientId) return;
    const isConfirmed = confirmed.has(id);

    setConfirmed(prev => {
      const next = new Set(prev);
      if (isConfirmed) next.delete(id);
      else next.add(id);
      return next;
    });

    if (!isConfirmed) {
      confirmAccess({
        clientId: clientId as Id<'clients'>,
        platform: id,
        accessType: 'admin',
      }).catch(console.error);
    }
  }

  async function handleContinue() {
    if (!clientId) return;
    await updateStep({ clientId: clientId as Id<'clients'>, step: 7 });
    router.push('/onboarding/7-schedule-calls');
  }

  async function handleSkip() {
    if (!clientId) return;
    await updateStep({ clientId: clientId as Id<'clients'>, step: 7 });
    router.push('/onboarding/7-schedule-calls');
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Step 6</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Software Access</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Grant us access to the tools we need to build your AI department. Follow the guides below.</p>

      <div className="space-y-3">
        {PLATFORMS.map((platform) => (
          <div key={platform.id} className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210]">
            <button
              onClick={() => setExpanded(expanded === platform.id ? null : platform.id)}
              className="flex w-full items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  onClick={(e) => { e.stopPropagation(); toggleConfirm(platform.id); }}
                  className={`flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
                    confirmed.has(platform.id) ? 'border-[#0CBF6A] bg-[#0CBF6A]' : 'border-[rgba(255,255,255,0.2)]'
                  }`}
                >
                  {confirmed.has(platform.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17L4 12"/></svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${confirmed.has(platform.id) ? 'text-[rgba(255,255,255,0.5)] line-through' : 'text-[rgba(255,255,255,0.92)]'}`}>
                  {platform.name}
                </span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"
                className={`transition-transform ${expanded === platform.id ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {expanded === platform.id && (
              <div className="border-t border-[rgba(255,255,255,0.04)] px-5 pb-5 pt-4">
                <ol className="space-y-2">
                  {platform.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-[rgba(255,255,255,0.5)]">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-xs text-[rgba(255,255,255,0.4)]">{idx + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => toggleConfirm(platform.id)}
                  className="mt-4 rounded-lg bg-[rgba(12,191,106,0.1)] px-4 py-2 text-xs font-medium text-[#0CBF6A] transition-colors hover:bg-[rgba(12,191,106,0.2)]"
                >
                  {confirmed.has(platform.id) ? 'Undo' : 'Mark as Done'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleSkip} className="text-sm text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]">Skip for now</button>
        <button onClick={handleContinue} className="btn-shine rounded-xl bg-[#0CBF6A] px-8 py-3.5 text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5">
          Continue ({confirmed.size}/{PLATFORMS.length} done)
        </button>
      </div>
    </div>
  );
}
