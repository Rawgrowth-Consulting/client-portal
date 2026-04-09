import ResourcesGrid from '@/components/dashboard/ResourcesGrid';

export default async function ResourcesPage() {
  const resources: any[] = [];

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Resources</p>
      <h1 className="mb-2 text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>Resources & Updates</h1>
      <p className="mb-8 text-[rgba(255,255,255,0.5)]">Skills, tools, and updates pushed by the Rawgrowth team.</p>

      <ResourcesGrid resources={resources} />
    </div>
  );
}
