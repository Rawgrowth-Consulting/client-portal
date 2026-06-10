'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

const SHELL_BG = '#0A1210';
const SHELL_BORDER = '1px solid rgba(255,255,255,0.06)';

export default function SetupChecklist({ clientId }: { clientId: string | undefined }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    async function load() {
      const [clientRes, brandProfileRes, accessRes] = await Promise.all([
        supabase.from('clients').select('status,onboarding_step,deployment_status').eq('id', clientId).maybeSingle(),
        supabase.from('brand_profiles').select('id,approved_at,status').eq('client_id', clientId),
        supabase.from('software_access').select('id,status').eq('client_id', clientId),
      ]);

      // Gracefully attempt client_profile_documents (F-001 may not be shipped yet).
      // Supabase JS returns {data, error} — does NOT throw on missing table — so we
      // check error.code explicitly rather than relying on try/catch.
      let typedDocsCount = 0;
      let approvedTypedDocsCount = 0;
      const typed = await supabase
        .from('client_profile_documents')
        .select('id,approved_at')
        .eq('client_id', clientId);
      if (typed.data && !typed.error) {
        typedDocsCount = typed.data.length;
        approvedTypedDocsCount = typed.data.filter((d: any) => d.approved_at).length;
      }
      // If typed.error fires (table missing pre-F-001 or RLS denial), we silently
      // fall back to brand_profiles below.

      const client = clientRes.data ?? {};
      const brandProfiles = brandProfileRes.data ?? [];
      const access = accessRes.data ?? [];

      const onboardingDone = (client as any).status === 'active';
      const docsGenerated = typedDocsCount > 0 || brandProfiles.length > 0;
      const docsApproved = approvedTypedDocsCount > 0 || brandProfiles.some((bp: any) => bp.approved_at || bp.status === 'approved');
      const toolsConnected = access.some((a: any) => a.status === 'connected' || a.status === 'active');
      const packetReady = (client as any).deployment_status === 'packet_ready' || (client as any).deployment_status === 'provisioned' || (client as any).deployment_status === 'live';
      const instanceLive = (client as any).deployment_status === 'live';

      setItems([
        { id: 'onboarding', label: 'Onboarding completed', done: onboardingDone },
        { id: 'docs_generated', label: 'Profile docs generated', done: docsGenerated },
        { id: 'docs_approved', label: 'Profile docs approved', done: docsApproved },
        { id: 'tools_connected', label: 'Tools connected (Composio)', done: toolsConnected },
        { id: 'packet_ready', label: 'Deployment packet generated', done: packetReady },
        { id: 'instance_live', label: 'AI department live', done: instanceLive },
      ]);
      setLoaded(true);
    }

    load();
  }, [clientId]);

  if (!loaded) {
    return (
      <div className="rounded-xl p-6" style={{ background: SHELL_BG, border: SHELL_BORDER }}>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Setup status
        </h3>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Loading...
        </p>
      </div>
    );
  }

  const completed = items.filter((i) => i.done).length;

  return (
    <div className="rounded-xl p-6" style={{ background: SHELL_BG, border: SHELL_BORDER }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Setup status
        </h3>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {completed}/{items.length}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                background: item.done ? 'rgba(12,191,106,0.15)' : 'rgba(255,255,255,0.04)',
                border: item.done ? '1px solid rgba(12,191,106,0.35)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {item.done ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
            </span>
            <span
              className="text-sm"
              style={{
                color: item.done ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.45)',
                textDecoration: item.done ? 'none' : 'none',
              }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
