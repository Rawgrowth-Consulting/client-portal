import type { Deliverable } from '@/types';
import JourneyTimeline from './JourneyTimeline';
import PageHeader from '@/components/dashboard/PageHeader';

const MONTH_PLAN: Record<number, { label: string; focus: string }> = {
  1: { label: 'Month 1', focus: 'Content + Offer' },
  2: { label: 'Month 2', focus: 'Copy + Funnels' },
  3: { label: 'Month 3', focus: 'Sales System' },
  4: { label: 'Month 4', focus: 'Data + KPIs' },
};

export default async function JourneyPage() {
  const deliverables: Deliverable[] = [];
  const currentMonth = 1;
  const currentWeek = 1;

  return (
    <div>
      <PageHeader
        eyebrow="Your Journey"
        title="4-Month Delivery Plan"
        description="Track every deliverable across your engagement. Green checkmarks are set by your team as work completes."
      />

      <JourneyTimeline
        deliverables={JSON.parse(JSON.stringify(deliverables))}
        monthPlan={MONTH_PLAN}
        currentMonth={currentMonth}
        currentWeek={currentWeek}
      />
    </div>
  );
}
