import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import BrandProfileView from '@/components/dashboard/BrandProfileView';

export default async function BrandProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const userId = user.id;
  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
  if (clients.length === 0) redirect('/login');

  let profile = null;
  try {
    const profiles = await adminPb.collection('brand_profiles').getFullList({
      filter: `client_id = "${clients[0].id}"`,
      sort: '-version',
    });
    profile = (profiles[0] as any) || null;
  } catch {}

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Brand Profile</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Your Brand Profile</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">The single source of truth for all AI agents working with your brand.</p>

      <BrandProfileView profile={profile} />
    </div>
  );
}
