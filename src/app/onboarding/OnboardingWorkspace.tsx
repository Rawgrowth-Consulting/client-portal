'use client';

import { useEffect, useState } from 'react';
import { Map as MapIcon, X } from 'lucide-react';
import OnboardingChat from './OnboardingChat';
import LiveOperatingMap from './LiveOperatingMap';
import WelcomeScreen from './WelcomeScreen';

interface Progress {
  current: number;
  total: number;
  completed: string[];
}

const WELCOME_STORAGE_KEY = 'rg.onboarding.welcomed';

/**
 * Split-view shell: chat on the left, the live operating map on the right
 * (desktop), or a slide-up drawer on mobile. Owns the `refreshKey` so the
 * map refetches every time the chat reports progress.
 */
export default function OnboardingWorkspace({
  firstName,
  company,
  initialProgress,
}: {
  firstName: string | null;
  company: string | null;
  initialProgress: Progress;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  // Show the Welcome (Stage 0) screen once per browser. Skip it for anyone
  // who's already progressed past step 1 (they shouldn't see it again).
  const [welcomed, setWelcomed] = useState<boolean>(true); // assume welcomed until we check client-side
  useEffect(() => {
    if (initialProgress.current > 0) {
      setWelcomed(true);
      return;
    }
    try {
      setWelcomed(localStorage.getItem(WELCOME_STORAGE_KEY) === '1');
    } catch {
      setWelcomed(false);
    }
  }, [initialProgress.current]);

  const handleBegin = () => {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, '1');
    } catch {}
    setWelcomed(true);
  };

  if (!welcomed) {
    return <WelcomeScreen firstName={firstName} company={company} onBegin={handleBegin} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-row">
      {/* Chat (always visible) */}
      <div className="min-h-0 flex-1 lg:flex-[3]">
        <OnboardingChat
          firstName={firstName}
          initialProgress={initialProgress}
          onProgress={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {/* Map (desktop only) */}
      <aside className="hidden min-h-0 border-l border-white/5 bg-[#070C0A] lg:flex lg:w-[520px] lg:flex-col xl:w-[600px]">
        <LiveOperatingMap refreshKey={refreshKey} />
      </aside>

      {/* Floating "View your map" button (mobile only) */}
      <button
        type="button"
        onClick={() => setMobileMapOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[rgba(12,191,106,0.18)] px-3.5 py-2 text-[12px] font-medium text-[#0CBF6A] backdrop-blur lg:hidden"
        style={{ border: '1px solid rgba(12,191,106,0.35)' }}
        aria-label="View your map"
      >
        <MapIcon className="h-3.5 w-3.5" />
        Your map
      </button>

      {/* Mobile drawer */}
      {mobileMapOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#060B08] lg:hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-sm font-medium text-white/85">Your business — mapped live</p>
            <button
              type="button"
              onClick={() => setMobileMapOpen(false)}
              aria-label="Close"
              className="rounded-md p-1 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <LiveOperatingMap refreshKey={refreshKey} />
          </div>
        </div>
      )}
    </div>
  );
}
