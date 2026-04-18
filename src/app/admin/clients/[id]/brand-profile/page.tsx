import { requireAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { BrandProfileEditor } from './brand-profile-editor';

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const { data: clientRaw } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (!clientRaw) return <div>Client not found</div>;

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="text-xs font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          All Clients
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <Link
          href={`/admin/clients/${id}`}
          className="text-xs font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {clientRaw.name}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Brand Profile
        </span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Brand Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {clientRaw.company}
          </p>
        </div>
        {brandProfile && (
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              v{brandProfile.version}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background:
                  brandProfile.status === 'approved'
                    ? 'rgba(12,191,106,0.12)'
                    : brandProfile.status === 'ready'
                      ? 'rgba(234,179,8,0.12)'
                      : 'rgba(59,130,246,0.12)',
                color:
                  brandProfile.status === 'approved'
                    ? '#0CBF6A'
                    : brandProfile.status === 'ready'
                      ? '#eab308'
                      : '#3b82f6',
              }}
            >
              {brandProfile.status}
            </span>
          </div>
        )}
      </div>

      {brandProfile ? (
        <BrandProfileEditor profile={brandProfile} clientId={id} />
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No brand profile generated yet. Complete the questionnaire first.
          </p>
        </div>
      )}
    </div>
  );
}
