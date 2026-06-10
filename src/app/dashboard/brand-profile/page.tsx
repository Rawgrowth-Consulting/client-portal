import BrandProfileView from '@/components/dashboard/BrandProfileView';
import { getAuthUser } from '@/lib/auth';
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
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
        eyebrow="Automation Map"
        title="Your Business Process & Automation Map"
        description="The ranked plan of what we automate, the tools we connect, and your 90-day roadmap — generated from your discovery."
      />

      <BrandProfileView profile={profile} />
    </div>
  );
}
