import { redirect } from 'next/navigation';
import { getEffectiveUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Response } from '@/components/ui/response';
import { DOC_TYPES, DOC_TITLES, type DocType } from '@/lib/docs/types';

const PANEL = { background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' };

// Client read view (FC-06): latest APPROVED version of each type. Unapproved
// types show a placeholder. Scoped to the effective client (impersonation-aware).
export default async function ClientDocsPage() {
  const eff = await getEffectiveUser();
  if (!eff) redirect('/login');
  if (eff.effective.role === 'admin' && !eff.impersonating) redirect('/admin');

  const clientId = eff.effective.id;
  const { data: rows } = await supabaseAdmin
    .from('client_profile_documents')
    .select('type, title, content_markdown, version, approved_at')
    .eq('client_id', clientId)
    .not('approved_at', 'is', null)
    .order('version', { ascending: false });

  const approved = new Map<DocType, { title: string; content_markdown: string }>();
  for (const r of rows ?? []) {
    if (!approved.has(r.type as DocType)) approved.set(r.type as DocType, r);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
        Your Documents
      </h1>
      <div className="flex flex-col gap-4">
        {DOC_TYPES.map((type) => {
          const doc = approved.get(type);
          return (
            <div key={type} className="rounded-xl p-6" style={PANEL}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {DOC_TITLES[type]}
              </h2>
              {doc ? (
                <Response>{doc.content_markdown}</Response>
              ) : (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Pending admin review
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
