'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { SOP_NODES, FLOW_EDGES, STAGE_COLORS, SOPNode, StageColor } from './sop-data';
import SOPDrawer from './SOPDrawer';

// ─── Layout positions ─────────────────────────────────────────────────────────
// Manually positioned for clean visual flow
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'prospect':         { x: 600,  y: 0    },
  'dm-outreach':      { x: 600,  y: 120  },
  'no-reply':         { x: 250,  y: 240  },
  'interested':       { x: 600,  y: 360  },
  'call-booked':      { x: 600,  y: 490  },
  'no-show':          { x: 200,  y: 610  },
  'discovery-call':   { x: 600,  y: 630  },
  'call-scored':      { x: 600,  y: 760  },
  'proposal-sent':    { x: 600,  y: 900  },
  'follow-up-1':      { x: 950,  y: 1020 },
  'follow-up-2':      { x: 950,  y: 1150 },
  'follow-up-3':      { x: 950,  y: 1280 },
  'objection':        { x: 250,  y: 1020 },
  'reactivation':     { x: 200,  y: 1400 },
  'closed-won':       { x: 600,  y: 1530 },
  'portal-invite':    { x: 600,  y: 1680 },
  'brand-intake':     { x: 600,  y: 1820 },
  'brand-profile':    { x: 600,  y: 1960 },
  'rawclaw-install':  { x: 600,  y: 2100 },
  'portal-sync-step': { x: 600,  y: 2240 },
  'agent-config':     { x: 600,  y: 2380 },
  'go-live':          { x: 600,  y: 2520 },
  'month-1':          { x: 600,  y: 2660 },
  'ongoing':          { x: 600,  y: 2800 },
};

// ─── Custom node component ────────────────────────────────────────────────────
function StageNode({ data, selected }: NodeProps) {
  const sop = data.sop as SOPNode;
  const colors = STAGE_COLORS[sop.stage as StageColor];

  const isDecision = sop.type === 'decision';
  const isSequence = sop.type === 'sequence';
  const isOutcome = sop.type === 'outcome';

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: colors.border, width: 8, height: 8 }} />
      <div
        style={{
          background: selected ? '#1e293b' : '#0f172a',
          border: `2px solid ${selected ? colors.badge : colors.border}`,
          borderRadius: isDecision ? '12px' : isSequence ? '6px' : '10px',
          padding: '10px 16px',
          minWidth: 200,
          maxWidth: 240,
          cursor: 'pointer',
          boxShadow: selected ? `0 0 20px ${colors.badge}44` : 'none',
          transition: 'all 0.15s ease',
          opacity: isSequence ? 0.85 : 1,
        }}
      >
        {/* Stage badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: colors.badge,
              background: `${colors.badge}18`,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {sop.stage}
          </span>
          {(sop.type === 'stage') && (
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>STAGE</span>
          )}
        </div>

        {/* Label */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
          {sop.label}
        </div>

        {/* Sublabel */}
        {sop.sublabel && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {sop.sublabel}
          </div>
        )}

        {/* SOP step count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>
            {sop.sop.steps.length} steps
          </span>
          {sop.sop.bottleneckFlag && (
            <span style={{ fontSize: 9, color: '#f59e0b', background: '#f59e0b18', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>
              ⚠ BOTTLENECK
            </span>
          )}
          <span style={{ fontSize: 10, color: colors.border, marginLeft: 'auto' }}>→ SOP</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: colors.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: colors.border, width: 8, height: 8 }} />
    </>
  );
}

const nodeTypes = { stageNode: StageNode };

// ─── Build React Flow nodes from SOP data ─────────────────────────────────────
function buildNodes(onSelect: (sop: SOPNode) => void): Node[] {
  return SOP_NODES.map((sop) => ({
    id: sop.id,
    type: 'stageNode',
    position: NODE_POSITIONS[sop.id] || { x: 600, y: 0 },
    data: { sop, onSelect },
    draggable: true,
  }));
}

// ─── Build React Flow edges ───────────────────────────────────────────────────
function buildEdges(): Edge[] {
  return FLOW_EDGES.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated || false,
    style: {
      stroke: e.animated ? '#22c55e' : '#334155',
      strokeWidth: e.animated ? 2 : 1.5,
    },
    labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
    labelBgPadding: [4, 6] as [number, number],
    type: 'smoothstep',
  }));
}

// ─── Stage legend ──────────────────────────────────────────────────────────────
const LEGEND_ITEMS: { stage: StageColor; label: string }[] = [
  { stage: 'outbound', label: 'Outbound' },
  { stage: 'booking', label: 'Booking' },
  { stage: 'call', label: 'Discovery' },
  { stage: 'noshow', label: 'No-Show' },
  { stage: 'proposal', label: 'Proposal' },
  { stage: 'negotiation', label: 'Objections' },
  { stage: 'reactivation', label: 'Reactivation' },
  { stage: 'won', label: 'Closed Won' },
  { stage: 'onboarding', label: 'Onboarding' },
  { stage: 'setup', label: 'Setup' },
  { stage: 'fulfillment', label: 'Fulfillment' },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlowChart() {
  const [selectedSOP, setSelectedSOP] = useState<SOPNode | null>(null);

  const initialNodes = buildNodes(setSelectedSOP);
  const initialEdges = buildEdges();

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const sop = SOP_NODES.find((s) => s.id === node.id);
    if (sop) setSelectedSOP(sop);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#020817' }}>
      {/* Flow */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to bottom, #020817 70%, transparent)',
          padding: '20px 24px 24px',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#0CBF6A', textTransform: 'uppercase', marginBottom: 4 }}>
                Rawclaw
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                Client Journey Map
              </h1>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                DM to fully deployed — {SOP_NODES.length} stages · Click any node to see full SOP
              </p>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', maxWidth: 480, pointerEvents: 'auto' }}>
              {LEGEND_ITEMS.map((item) => (
                <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: STAGE_COLORS[item.stage].badge }} />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          style={{ background: '#020817' }}
          defaultViewport={{ x: 0, y: 80, zoom: 0.72 }}
        >
          <Background color="#1e293b" gap={24} size={1} />
          <Controls
            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
          />
          <MiniMap
            style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8 }}
            nodeColor={(node) => {
              const sop = SOP_NODES.find((s) => s.id === node.id);
              return sop ? STAGE_COLORS[sop.stage].badge : '#334155';
            }}
            maskColor="#020817aa"
          />
        </ReactFlow>
      </div>

      {/* SOP Drawer */}
      <SOPDrawer sop={selectedSOP} onClose={() => setSelectedSOP(null)} />
    </div>
  );
}
