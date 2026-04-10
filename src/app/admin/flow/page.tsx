import { requireAdmin } from '@/lib/auth';
import FlowLoader from './FlowLoader';

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
      <FlowLoader />
    </div>
  );
}
