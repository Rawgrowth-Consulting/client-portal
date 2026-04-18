import ActivityFeed from '@/components/ActivityFeed';
import PageHeader from '@/components/dashboard/PageHeader';

export default async function ActivityPage() {

  return (
    <div>
      <PageHeader
        eyebrow="AI Department"
        title="Activity Feed"
        description="Real-time log of everything your AI department is doing."
      />

      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-5">
        <ActivityFeed showFilters={true} />
      </div>
    </div>
  );
}
