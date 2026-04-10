'use client';

import dynamic from 'next/dynamic';

const FlowChart = dynamic(() => import('./FlowChart'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: '#020817', color: '#475569', fontSize: 13,
    }}>
      Loading flow map...
    </div>
  ),
});

export default function FlowLoader() {
  return <FlowChart />;
}
