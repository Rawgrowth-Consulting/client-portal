import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { ClientDetailInteractive } from './client-detail-interactive';

const STEP_NAMES: Record<number, string> = {
  1: 'Welcome',
  2: 'Questionnaire',
  3: 'Brand Profile',
  4: 'Brand Docs',
  5: 'Software Access',
  6: 'Schedule Calls',
  7: 'Activate',
  8: 'Complete',
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!client) return <div>Client not found</div>;

  const isComplete = client.status === 'active';

  // Brand profile (latest version)
  const { data: brandProfile } = await supabaseAdmin
    .from('brand_profiles')
    .select('*')
    .eq('client_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Brand intake (Section 2 questionnaire)
  const { data: intake } = await supabaseAdmin
    .from('brand_intakes')
    .select('*')
    .eq('client_id', id)
    .maybeSingle();

  const questionnaireData: Record<string, any> | null = intake
    ? {
        basic_info: intake.basic_info,
        social_presence: intake.social_presence,
        origin_story: intake.origin_story,
        business_model: intake.business_model,
        target_audience: intake.target_audience,
        goals: intake.goals,
        challenges: intake.challenges,
        brand_voice: intake.brand_voice,
        competitors: intake.competitors,
        content_messaging: intake.content_messaging,
        sales: intake.sales,
        tools_systems: intake.tools_systems,
        additional_context: intake.additional_context,
        call_data: intake.call_data,
      }
    : null;

  // Deliverables — no Supabase table yet, show empty list.
  const deliverables: any[] = [];

  // Rawclaw heartbeat — not implemented in Supabase yet.
  const rawclawInstall: any = null;

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
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {client.name}
        </span>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {client.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {client.company} -- {client.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {brandProfile && (
            <Link
              href={`/admin/clients/${id}/brand-profile`}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:border-[rgba(12,191,106,0.4)]"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              View Brand Profile
            </Link>
          )}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background:
                client.status === 'active'
                  ? 'rgba(12,191,106,0.12)'
                  : client.status === 'churned'
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(59,130,246,0.12)',
              color:
                client.status === 'active'
                  ? '#0CBF6A'
                  : client.status === 'churned'
                    ? '#ef4444'
                    : '#3b82f6',
            }}
          >
            {client.status}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: 'Health Score',
            value: String(client.health_score ?? 0),
            color:
              (client.health_score ?? 0) >= 80
                ? '#0CBF6A'
                : (client.health_score ?? 0) >= 60
                  ? '#eab308'
                  : '#ef4444',
          },
          { label: 'Current Month', value: String(client.current_month ?? 1), color: '#0CBF6A' },
          {
            label: 'Onboarding',
            value: isComplete ? 'Complete' : `Step ${client.onboarding_step ?? 1}/8`,
            color: isComplete ? '#0CBF6A' : '#3b82f6',
          },
          {
            label: 'Deliverables',
            value: `${deliverables.filter((d) => d.completed).length}/${deliverables.length}`,
            color: '#0CBF6A',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl p-5"
            style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
              }}
            />
            <div className="text-2xl font-medium" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding Steps */}
      <div
        className="mb-6 overflow-hidden rounded-xl"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
          }}
        />
        <div className="p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Onboarding Progress
          </h2>
          <div className="grid gap-2">
            {Array.from({ length: 8 }, (_, i) => {
              const stepNum = i + 1;
              const currentStep = client.onboarding_step ?? 1;
              const completed = isComplete || stepNum < currentStep;
              const current = !isComplete && stepNum === currentStep;
              return (
                <div
                  key={stepNum}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: current ? 'rgba(12,191,106,0.06)' : 'transparent' }}
                >
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: completed
                        ? '#0CBF6A'
                        : current
                          ? 'rgba(12,191,106,0.2)'
                          : 'rgba(255,255,255,0.06)',
                      color: completed ? '#fff' : current ? '#0CBF6A' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {completed ? '\u2713' : stepNum}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: completed
                        ? 'rgba(255,255,255,0.6)'
                        : current
                          ? 'rgba(255,255,255,0.92)'
                          : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {STEP_NAMES[stepNum]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questionnaire Responses */}
      {questionnaireData && (
        <div
          className="mb-6 overflow-hidden rounded-xl"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
            }}
          />
          <div className="p-6">
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Questionnaire Responses
            </h2>
            <QuestionnaireViewer data={questionnaireData} />
          </div>
        </div>
      )}

      {/* Interactive sections */}
      <ClientDetailInteractive
        clientId={id}
        deliverables={deliverables}
        healthScore={client.health_score ?? 0}
      />

      {/* Touchpoints Log */}
      <div
        className="mt-6 overflow-hidden rounded-xl"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
          }}
        />
        <div className="p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Touchpoints Log
          </h2>
          <div
            className="rounded-lg px-4 py-8 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Touchpoint tracking coming soon. All calls, emails, and check-ins will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* RawClaw Install Status */}
      <div
        className="mt-6 overflow-hidden rounded-xl"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
          }}
        />
        <div className="p-6">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Rawclaw Status
          </h2>
          {rawclawInstall ? (
            <RawclawStatusCard install={rawclawInstall} />
          ) : (
            <div
              className="rounded-lg px-4 py-8 text-center"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                No install detected. Setup token will appear on the client&apos;s onboarding complete
                page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  basic_info: 'Basic Info',
  social_presence: 'Social Presence',
  origin_story: 'Origin Story',
  business_model: 'Business Model',
  target_audience: 'Target Audience',
  goals: 'Goals',
  challenges: 'Challenges',
  brand_voice: 'Brand Voice',
  competitors: 'Competitors',
  content_messaging: 'Content & Messaging',
  sales: 'Sales',
  tools_systems: 'Tools & Systems',
  additional_context: 'Additional Context',
  call_data: 'Call Data',
};

function QuestionnaireViewer({ data }: { data: Record<string, any> }) {
  const sections = Object.entries(SECTION_LABELS).filter(
    ([key]) => data[key] && typeof data[key] === 'object' && Object.keys(data[key]).length > 0
  );

  if (sections.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
        No questionnaire data submitted yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {sections.map(([key, label]) => (
        <details key={key} className="group">
          <summary
            className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <span className="text-sm font-medium">{label}</span>
            <span
              className="text-[10px] transition-transform group-open:rotate-90"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {'\u25B6'}
            </span>
          </summary>
          <div className="mt-1 rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            {Object.entries(data[key] as Record<string, any>).map(([field, value]) => (
              <div key={field} className="mb-2 last:mb-0">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {field.replace(/_/g, ' ')}
                </span>
                <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function RawclawStatusCard({ install }: { install: any }) {
  const lastHeartbeat = new Date(install.last_heartbeat);
  const minutesAgo = Math.floor((Date.now() - lastHeartbeat.getTime()) / 60000);
  const isOnline = minutesAgo < 10;
  const agents: string[] =
    typeof install.active_agents === 'string'
      ? JSON.parse(install.active_agents || '[]')
      : install.active_agents || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: isOnline ? '#0CBF6A' : '#ef4444' }}
          />
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Last heartbeat</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              {minutesAgo < 60
                ? `${minutesAgo}m ago`
                : lastHeartbeat.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Version</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              {install.rawclaw_version || 'unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Machine ID</span>
            <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {install.machine_id?.slice(0, 12)}...
            </span>
          </div>
        </div>
      </div>
      <div>
        <div
          className="mb-2 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Active Agents
        </div>
        {agents.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {agents.map((agent) => (
              <span
                key={agent}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(12,191,106,0.10)', color: '#0CBF6A' }}
              >
                {agent}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No agents reported
          </p>
        )}
      </div>
    </div>
  );
}
