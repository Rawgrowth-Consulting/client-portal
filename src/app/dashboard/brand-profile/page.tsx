import BrandProfileView from '@/components/dashboard/BrandProfileView';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default async function BrandProfilePage() {
  const user = await getAuthUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('client_id', user.id)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    profile = data;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Brand Profile</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Your Brand Profile</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">The single source of truth for all AI agents working with your brand.</p>

      <BrandProfileView profile={profile} />
    </div>
  );
}
