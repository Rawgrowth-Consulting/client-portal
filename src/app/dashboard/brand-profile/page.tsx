import BrandProfileView from '@/components/dashboard/BrandProfileView';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/dashboard/PageHeader';

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
      <PageHeader
        eyebrow="Brand Profile"
        title="Your Brand Profile"
        description="The single source of truth for all AI agents working with your brand."
      />

      <BrandProfileView profile={profile} />
    </div>
  );
}
