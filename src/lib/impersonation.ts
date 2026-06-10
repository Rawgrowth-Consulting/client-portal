import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Audit-row-as-source-of-truth: if no active row, there is no impersonation.
// The cookie only carries the session id; all trust derives from the DB row.
export const IMP_COOKIE = "imp_session_id";

export type ImpersonationSession = {
  id: string;
  admin_user_id: string;
  client_user_id: string;
  client_id: string;
  started_at: string;
  ended_at: string | null;
  reason: string;
};

// The next-auth session id is a clients.id, but admin_impersonation_sessions
// references client_users.id. Resolve the owning client_user for a given client.
export async function resolveClientUserId(clientId: string): Promise<string | null> {
  const owner = await supabaseAdmin
    .from("client_users")
    .select("id")
    .eq("client_id", clientId)
    .eq("role", "owner")
    .maybeSingle();
  if (owner.data?.id) return owner.data.id;

  const any = await supabaseAdmin
    .from("client_users")
    .select("id")
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();
  return any.data?.id ?? null;
}

// Returns the active session row, or null if no cookie / missing row / already
// ended. An ended row is treated as no impersonation (FC-07).
export async function getActiveImpersonationSession(): Promise<ImpersonationSession | null> {
  const store = await cookies();
  const id = store.get(IMP_COOKIE)?.value;
  if (!id) return null;

  const { data } = await supabaseAdmin
    .from("admin_impersonation_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.ended_at) return null;
  return data as ImpersonationSession;
}
