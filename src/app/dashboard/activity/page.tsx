import ActivityFeed from '@/components/ActivityFeed';

export default async function ActivityPage() {

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">AI Department</p>
        <h1 className="text-2xl font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Activity Feed
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Real-time log of everything your AI department is doing.
        </p>
      </div>

      {/* Feed */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-5">
        <ActivityFeed showFilters={true} />
      </div>
    </div>
  );
}
