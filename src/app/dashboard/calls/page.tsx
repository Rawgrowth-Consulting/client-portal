import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import type { ScheduledCall } from '@/types';

function formatCallDate(dateStr: string | null): string {
  if (!dateStr) return 'Not yet scheduled';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCallTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isUpcoming(call: ScheduledCall): boolean {
  if (call.completed) return false;
  if (!call.scheduled_at) return true;
  return new Date(call.scheduled_at) > new Date();
}

export default async function CallsPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const userId = user.id;
  const adminPb = await createAdminClient();

  const clients = await adminPb.collection('clients').getFullList({
    filter: `user_id = "${userId}"`,
  });
  if (clients.length === 0) redirect('/login');
  const client = clients[0];

  let calls: ScheduledCall[] = [];
  try {
    const records = await adminPb.collection('scheduled_calls').getFullList({
      filter: `client_id = "${client.id}"`,
      sort: 'month,week',
    });
    calls = records as unknown as ScheduledCall[];
  } catch {}

  const upcoming = calls.filter((c) => isUpcoming(c));
  const past = calls.filter((c) => !isUpcoming(c));

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#0CBF6A' }}>
          Calls
        </p>
        <h2 className="mt-1 text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Milestone Calls
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Scheduled check-ins keep your 4-month journey on track. Each call covers progress, blockers, and
          next steps.
        </p>
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h3
          className="mb-4 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Upcoming
        </h3>

        {upcoming.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No upcoming calls scheduled.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((call) => (
              <div
                key={call.id}
                className="relative overflow-hidden rounded-xl p-5"
                style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(12,191,106,0.25), transparent)',
                  }}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(12,191,106,0.1)', color: '#0CBF6A' }}
                    >
                      M{call.month}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        {call.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {formatCallDate(call.scheduled_at)}
                        </span>
                        {call.scheduled_at && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {formatCallTime(call.scheduled_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {call.calendly_url && call.scheduled_at && (
                      <a
                        href={call.calendly_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-shine inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                        style={{ background: '#0CBF6A', color: '#fff' }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Join Call
                      </a>
                    )}
                    {!call.scheduled_at && (
                      <a
                        href={
                          call.calendly_url || 'https://calendly.com/chriswestt/rawgrowth-discovery'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        style={{ background: 'rgba(12,191,106,0.1)', color: '#0CBF6A' }}
                      >
                        Schedule
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Calls */}
      {past.length > 0 && (
        <div className="mb-8">
          <h3
            className="mb-4 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Past Calls
          </h3>
          <div className="space-y-2">
            {past.map((call) => (
              <div
                key={call.id}
                className="rounded-xl p-5"
                style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}
                    >
                      M{call.month}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {call.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {formatCallDate(call.scheduled_at)}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: 'rgba(12,191,106,0.06)',
                            color: 'rgba(12,191,106,0.5)',
                          }}
                        >
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {call.notes && (
                    <a
                      href={call.notes}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      View Recording
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Additional Call CTA */}
      <div
        className="relative overflow-hidden rounded-xl p-6 text-center"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.2), transparent)',
          }}
        />
        <p className="mb-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Need to discuss something outside the regular schedule?
        </p>
        <p className="mb-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Book an additional call with the Rawgrowth team.
        </p>
        <a
          href="https://calendly.com/chriswestt/rawgrowth-discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-shine inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
          style={{ background: '#0CBF6A', color: '#fff' }}
        >
          Book Additional Call
        </a>
      </div>
    </div>
  );
}
