import { requireAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { BrandProfileEditor } from './brand-profile-editor';
import {
  INTAKE_COLUMNS,
  BUSINESS_FUNCTIONS,
  FUNCTION_DEEPDIVE_FIELDS,
  SYSTEM_FIELDS,
} from '@/lib/onboarding';

const C = INTAKE_COLUMNS;
const fnLabel = (id: string) => BUSINESS_FUNCTIONS.find((f) => f.id === id)?.label ?? id;

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const { data: clientRaw } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (!clientRaw) return <div>Client not found</div>;

  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('client_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const { data: intake } = await supabase
    .from('brand_intakes')
    .select('*')
    .eq('client_id', id)
    .maybeSingle();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="text-xs font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          All Clients
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <Link
          href={`/admin/clients/${id}`}
          className="text-xs font-medium transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {clientRaw.name}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Automation Map
        </span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Business Process &amp; Automation Map
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {clientRaw.company}
          </p>
        </div>
        {brandProfile && (
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              v{brandProfile.version}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background:
                  brandProfile.status === 'approved'
                    ? 'rgba(12,191,106,0.12)'
                    : brandProfile.status === 'ready'
                      ? 'rgba(234,179,8,0.12)'
                      : 'rgba(59,130,246,0.12)',
                color:
                  brandProfile.status === 'approved'
                    ? '#0CBF6A'
                    : brandProfile.status === 'ready'
                      ? '#eab308'
                      : '#3b82f6',
              }}
            >
              {brandProfile.status}
            </span>
          </div>
        )}
      </div>

      {brandProfile ? (
        <BrandProfileEditor profile={brandProfile} clientId={id} />
      ) : (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No automation map generated yet. The client needs to finish onboarding first.
          </p>
        </div>
      )}

      <OperationsIntake intake={intake} />
    </div>
  );
}

// ── Operations layer (raw structured intake feeding the install) ──────────────

const panel = {
  background: '#0A1210',
  border: '1px solid rgba(255,255,255,0.06)',
} as const;

function OperationsIntake({ intake }: { intake: Record<string, any> | null }) {
  if (!intake) return null;

  const snapshot = intake[C.companySnapshot] as Record<string, any> | undefined;
  const scope = intake[C.functionSelector] as Record<string, any> | undefined;
  const deepDives = (intake[C.functionDeepDives] ?? []) as any[];
  const tools = (intake[C.toolStack] ?? []) as any[];
  const goals = intake[C.goals] as Record<string, any> | undefined;
  const guardrails = intake[C.guardrails] as Record<string, any> | undefined;
  const people = (intake[C.people] ?? []) as any[];
  const market = intake[C.market] as Record<string, any> | undefined;
  const access = (intake[C.accessInventory] ?? []) as any[];

  const hasOps =
    (snapshot && Object.keys(snapshot).length > 0) ||
    deepDives.length > 0 ||
    tools.length > 0;
  if (!hasOps) return null;

  return (
    <div className="mt-10">
      <h2
        className="mb-1 text-lg font-medium"
        style={{ color: 'rgba(255,255,255,0.9)' }}
      >
        Operations Intake
      </h2>
      <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Raw structured answers that feed the install (install-architect). Headline analysis is the
        Automation Map above.
      </p>

      <div className="grid gap-4">
        {snapshot && Object.keys(snapshot).length > 0 && (
          <KVCard title="Company snapshot" data={snapshot} />
        )}
        {scope && Object.keys(scope).length > 0 && (
          <KVCard title="Functions in scope" data={scope} transformKey={fnTransform} />
        )}

        {deepDives.length > 0 && (
          <div className="rounded-xl p-5" style={panel}>
            <SectionTitle>Function deep-dives ({deepDives.length}) — candidate automations</SectionTitle>
            <div className="grid gap-3">
              {deepDives.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="mb-2 text-sm font-medium" style={{ color: '#0CBF6A' }}>
                    {fnLabel(row.function_id)}
                  </p>
                  <KVList
                    data={row}
                    omit={['function_id']}
                    labels={Object.fromEntries(FUNCTION_DEEPDIVE_FIELDS.map((f) => [f.key, f.label]))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div className="rounded-xl p-5" style={panel}>
            <SectionTitle>Tool stack ({tools.filter((t) => t.product && t.product !== 'none').length}) — Composio connection source</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {SYSTEM_FIELDS.map((f) => (
                      <th key={f.key} className="px-2 py-1.5 font-medium">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t, idx) => (
                    <tr
                      key={idx}
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        opacity: t.product === 'none' ? 0.4 : 1,
                      }}
                    >
                      {SYSTEM_FIELDS.map((f) => (
                        <td key={f.key} className="px-2 py-1.5">
                          {String(t[f.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {goals && Object.keys(goals).length > 0 && <KVCard title="Goals & bottlenecks" data={goals} />}
        {guardrails && Object.keys(guardrails).length > 0 && (
          <KVCard title="Guardrails" data={guardrails} />
        )}
        {market && Object.keys(market).length > 0 && <KVCard title="Market & customers" data={market} />}

        {people.length > 0 && (
          <div className="rounded-xl p-5" style={panel}>
            <SectionTitle>Team ({people.length})</SectionTitle>
            <div className="grid gap-2">
              {people.map((p, idx) => (
                <p key={idx} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{p.name}</span>
                  {p.role ? ` · ${p.role}` : ''}
                  {p.functions ? ` · ${p.functions}` : ''}
                  {p.decision_maker ? ` · approver: ${p.decision_maker}` : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        {access.length > 0 && (
          <div className="rounded-xl p-5" style={panel}>
            <SectionTitle>Access &amp; connections to wire up ({access.length})</SectionTitle>
            <div className="grid gap-1.5">
              {access.map((a, idx) => (
                <p key={idx} className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{a.tool ?? '—'}</span>
                  {a.connect ? ` · ${a.connect}` : ''}
                  {a.notes ? ` · ${a.notes}` : ''}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fnTransform(key: string, value: any): [string, string] {
  if (key === 'active_functions' && Array.isArray(value)) {
    return ['Active functions', value.map(fnLabel).join(', ')];
  }
  return [key.replace(/_/g, ' '), Array.isArray(value) ? value.join(', ') : String(value)];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
      {children}
    </p>
  );
}

function KVCard({
  title,
  data,
  transformKey,
  labels,
}: {
  title: string;
  data: Record<string, any>;
  transformKey?: (key: string, value: any) => [string, string];
  labels?: Record<string, string>;
}) {
  return (
    <div className="rounded-xl p-5" style={panel}>
      <SectionTitle>{title}</SectionTitle>
      <KVList data={data} transformKey={transformKey} labels={labels} />
    </div>
  );
}

function KVList({
  data,
  omit = [],
  transformKey,
  labels,
}: {
  data: Record<string, any>;
  omit?: string[];
  transformKey?: (key: string, value: any) => [string, string];
  labels?: Record<string, string>;
}) {
  const entries = Object.entries(data).filter(([k, v]) => !omit.includes(k) && v != null && v !== '');
  if (entries.length === 0) return <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>—</p>;
  return (
    <dl className="grid gap-2">
      {entries.map(([k, v]) => {
        const [label, value] = transformKey
          ? transformKey(k, v)
          : [labels?.[k] ?? k.replace(/_/g, ' '), Array.isArray(v) ? v.join(', ') : String(v)];
        return (
          <div key={k} className="grid grid-cols-[160px_1fr] gap-3">
            <dt className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {label}
            </dt>
            <dd className="text-xs" style={{ color: 'rgba(255,255,255,0.78)' }}>
              {value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
