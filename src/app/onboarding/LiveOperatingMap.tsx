'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, Building2, Target, Sparkles } from 'lucide-react';

/**
 * Live Operating Map — a process-flow / value-chain view of the client's
 * business that assembles as they answer the onboarding. Renders functions,
 * tools, bottlenecks and the external market strip from /api/onboarding/map.
 *
 * Parent bumps `refreshKey` to trigger a refetch (e.g. after a section saves).
 */

type MapPayload = {
  company: { name?: string | null; one_liner?: string; scale?: string };
  market: { icp?: string };
  functions: Array<{
    id: string;
    label: string;
    active: boolean;
    deepDived: boolean;
    owner?: string;
    hours?: string;
    bottleneck?: string;
  }>;
  tools: Array<{ product: string; category?: string; functions: string[] }>;
  goal?: string;
  topBottlenecks?: string;
  insights: Array<{ headline: string; detail?: string }>;
  completeness: { totalActive: number; deepDived: number; toolsCaptured: number };
};

// ─── Custom nodes ─────────────────────────────────────────────────────────────

function HeaderNode({ data }: NodeProps<{ company: MapPayload['company']; market: MapPayload['market']; isNew?: boolean }>) {
  const { company, market } = data;
  return (
    <div
      className={`rounded-xl px-4 py-3 ${data.isNew ? 'rg-map-enter' : ''}`}
      style={{
        width: 560,
        background: 'linear-gradient(180deg, rgba(12,191,106,0.10), rgba(12,191,106,0.02))',
        border: '1px solid rgba(12,191,106,0.25)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(12,191,106,0.15)]">
          <Building2 className="h-4 w-4 text-[#0CBF6A]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0CBF6A]">Your business</p>
          <p className="truncate text-sm font-medium text-white/90">{company.name || 'Untitled'}</p>
          {(company.one_liner || company.scale) && (
            <p className="mt-0.5 truncate text-[11px] text-white/55">
              {[company.one_liner, company.scale].filter(Boolean).join(' · ')}
            </p>
          )}
          {market.icp && (
            <p className="mt-1.5 text-[11px] text-white/70">
              <span className="font-semibold text-white/45">ICP:</span> {market.icp}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 0 }} />
    </div>
  );
}

function FunctionNode({
  data,
}: NodeProps<{ label: string; active: boolean; deepDived: boolean; owner?: string; hours?: string; bottleneck?: string; isNew?: boolean }>) {
  const { label, deepDived, owner, hours, bottleneck } = data;
  const accent = deepDived ? '#0CBF6A' : 'rgba(255,255,255,0.25)';
  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${data.isNew ? 'rg-map-enter' : ''}`}
      style={{
        width: 180,
        background: deepDived ? 'rgba(12,191,106,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${deepDived ? 'rgba(12,191,106,0.32)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 0 }} />
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <p className="truncate text-[12px] font-medium text-white/85">{label}</p>
      </div>
      {(owner || hours) && (
        <p className="mt-1 truncate text-[10px] text-white/45">
          {[owner, hours].filter(Boolean).join(' · ')}
        </p>
      )}
      {bottleneck && (
        <div
          className="mt-1.5 flex items-start gap-1 rounded-md px-1.5 py-1 text-[10px]"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(252,165,165,0.95)' }}
        >
          <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" />
          <span className="leading-snug">{bottleneck}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 0 }} />
    </div>
  );
}

function ToolNode({ data }: NodeProps<{ product: string; category?: string; isNew?: boolean }>) {
  return (
    <div
      className={`rounded-md px-2.5 py-1.5 ${data.isNew ? 'rg-map-enter' : ''}`}
      style={{
        width: 130,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 0 }} />
      <p className="truncate text-[11px] font-medium text-white/80">{data.product}</p>
      {data.category && (
        <p className="truncate text-[9px] uppercase tracking-wider text-white/35">{data.category}</p>
      )}
    </div>
  );
}

function GoalNode({ data }: NodeProps<{ goal?: string; bottlenecks?: string; isNew?: boolean }>) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ${data.isNew ? 'rg-map-enter' : ''}`}
      style={{
        width: 260,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-white/55" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Goal &amp; bottlenecks</p>
      </div>
      {data.goal && <p className="mt-1.5 text-[11px] text-white/80">🎯 {data.goal}</p>}
      {data.bottlenecks && <p className="mt-1 text-[11px] text-white/65">⚠ {data.bottlenecks}</p>}
    </div>
  );
}

const NODE_TYPES = {
  header: HeaderNode,
  fn: FunctionNode,
  tool: ToolNode,
  goal: GoalNode,
};

// ─── Layout ───────────────────────────────────────────────────────────────────

function buildGraph(payload: MapPayload): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Header (company + ICP)
  nodes.push({
    id: 'header',
    type: 'header',
    position: { x: 80, y: 0 },
    data: { company: payload.company, market: payload.market },
    draggable: false,
  });

  // Goal pill, top-right
  if (payload.goal || payload.topBottlenecks) {
    nodes.push({
      id: 'goal',
      type: 'goal',
      position: { x: 680, y: 8 },
      data: { goal: payload.goal, bottlenecks: payload.topBottlenecks },
      draggable: false,
    });
  }

  // Function row
  const fnCount = payload.functions.length;
  const fnSpacing = 200;
  const totalFnWidth = Math.max(fnCount, 1) * fnSpacing;
  const fnStartX = Math.max(80, 480 - totalFnWidth / 2);
  const fnY = 200;

  payload.functions.forEach((fn, i) => {
    const id = `fn-${fn.id}`;
    nodes.push({
      id,
      type: 'fn',
      position: { x: fnStartX + i * fnSpacing, y: fnY },
      data: fn,
      draggable: false,
    });
    edges.push({
      id: `e-header-${id}`,
      source: 'header',
      target: id,
      type: 'smoothstep',
      style: { stroke: 'rgba(12,191,106,0.3)', strokeWidth: 1 },
    });
  });

  // Tool row (only tools linked to ≥1 function — keeps the map signal-rich)
  const linkedTools = payload.tools.filter((t) => t.functions.length > 0);
  const orphanTools = payload.tools.filter((t) => t.functions.length === 0).slice(0, 6); // a few unmapped as context
  const renderTools = [...linkedTools, ...orphanTools];

  const toolSpacing = 150;
  const totalToolWidth = Math.max(renderTools.length, 1) * toolSpacing;
  const toolStartX = Math.max(40, 480 - totalToolWidth / 2);
  const toolY = 380;

  renderTools.forEach((tool, i) => {
    const id = `tool-${i}-${tool.product}`;
    nodes.push({
      id,
      type: 'tool',
      position: { x: toolStartX + i * toolSpacing, y: toolY },
      data: { product: tool.product, category: tool.category },
      draggable: false,
    });
    tool.functions.forEach((fnId) => {
      edges.push({
        id: `e-${id}-fn-${fnId}`,
        source: `fn-${fnId}`,
        target: id,
        type: 'smoothstep',
        style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 },
      });
    });
  });

  return { nodes, edges };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveOperatingMap({ refreshKey }: { refreshKey: number }) {
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  // Track IDs we've already rendered so animations fire ONLY on genuinely new
  // nodes/edges, never on every refetch — keeps the polish premium, not gimmicky.
  const seenNodeIds = useRef<Set<string>>(new Set());
  const seenEdgeIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/api/onboarding/map')
      .then((r) => r.json())
      .then((data) => {
        if (alive) {
          setPayload(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const { nodes, edges } = useMemo(() => {
    if (!payload) return { nodes: [], edges: [] };
    const built = buildGraph(payload);
    const newNodeIds: string[] = [];
    const newEdgeIds: string[] = [];
    const enrichedNodes = built.nodes.map((n) => {
      const isNew = !seenNodeIds.current.has(n.id);
      if (isNew) newNodeIds.push(n.id);
      return { ...n, data: { ...n.data, isNew } };
    });
    const enrichedEdges = built.edges.map((e) => {
      const isNew = !seenEdgeIds.current.has(e.id);
      if (isNew) newEdgeIds.push(e.id);
      return isNew ? { ...e, className: `${e.className ?? ''} rg-edge-draw`.trim() } : e;
    });
    // Defer the seen-set update so animations actually play before the next
    // render strips the className. setTimeout pushes it after paint.
    setTimeout(() => {
      newNodeIds.forEach((id) => seenNodeIds.current.add(id));
      newEdgeIds.forEach((id) => seenEdgeIds.current.add(id));
    }, 700);
    return { nodes: enrichedNodes, edges: enrichedEdges };
  }, [payload]);

  const empty = !loading && (!payload || (payload.functions.length === 0 && !payload.company?.name && !payload.market?.icp));

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#0CBF6A]" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
            Your business — mapped live
          </p>
        </div>
        {payload && (
          <p className="text-[10px] text-white/40">
            {payload.completeness.deepDived}/{payload.completeness.totalActive} functions ·{' '}
            {payload.completeness.toolsCaptured} tools
          </p>
        )}
      </div>

      <div className="relative flex-1">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <Sparkles className="mb-3 h-6 w-6 text-white/25" />
            <p className="text-sm text-white/55">Your business will start mapping here.</p>
            <p className="mt-1 text-[11px] text-white/35">
              As you answer, functions, tools, and bottlenecks appear so you can see what we're understanding.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnDoubleClick={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.04)" gap={24} />
            <Controls showInteractive={false} className="!bg-[#0A1210] !border-white/5" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
