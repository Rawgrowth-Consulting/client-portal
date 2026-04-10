import { requireAdmin } from '@/lib/auth';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with React Flow
const FlowChart = dynamic(() => import('./FlowChart'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - 200px)', background: '#020817', color: '#475569', fontSize: 13,
    }}>
      Loading flow map...
    </div>
  ),
});

export default async function FlowPage() {
  await requireAdmin();

  return (
    <div style={{
      margin: '-32px -24px',
      height: 'calc(100vh - 57px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#020817',
      overflow: 'hidden',
    }}>
      <FlowChart />
    </div>
  );
}
