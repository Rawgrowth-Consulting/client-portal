import BrandProfileView from '@/components/dashboard/BrandProfileView';

export default async function BrandProfilePage() {
  const profile = null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Brand Profile</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Your Brand Profile</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">The single source of truth for all AI agents working with your brand.</p>

      <BrandProfileView profile={profile} />
    </div>
  );
}
