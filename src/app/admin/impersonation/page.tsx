import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// NF-04: impersonation audit log. requireAdmin() resolves the actual admin even
// during an active impersonation, so this page is admin-only (403/redirect for
// non-admins) regardless of impersonation state.
export default async function ImpersonationAuditPage() {
  await requireAdmin();

  const { data: sessions } = await supabaseAdmin
    .from('admin_impersonation_sessions')
    .select('id, client_id, admin_user_id, client_user_id, reason, started_at, ended_at')
    .order('started_at', { ascending: false })
    .limit(100);

  const rows = sessions ?? [];

  // Resolve display names for admin + target client_users in one round trip.
  const userIds = Array.from(
    new Set(rows.flatMap((r) => [r.admin_user_id, r.client_user_id]))
  );
  const { data: users } = userIds.length
    ? await supabaseAdmin.from('client_users').select('id, name, email').in('id', userIds)
    : { data: [] as { id: string; name: string; email: string }[] };
  const nameById = new Map((users ?? []).map((u) => [u.id, u.name || u.email]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
        Impersonation Log
      </h1>

      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          No impersonation sessions recorded yet.
        </p>
      ) : (
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ color: 'rgba(255,255,255,0.4)' }}>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Ended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <td className="px-4 py-3">{nameById.get(r.admin_user_id) ?? '—'}</td>
                  <td className="px-4 py-3">{nameById.get(r.client_user_id) ?? '—'}</td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">{new Date(r.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {r.ended_at ? (
                      new Date(r.ended_at).toLocaleString()
                    ) : (
                      <span style={{ color: '#eab308' }}>active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
