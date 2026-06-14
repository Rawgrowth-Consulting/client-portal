import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Returns the actual admin's id (not the impersonated user) when the caller is
// an admin, else null. Shared by admin-only API routes.
export async function requireAdminId(): Promise<string | null> {
  const actor = await getAuthUser();
  if (!actor) return null;
  const { data } = await supabaseAdmin.from("clients").select("role").eq("id", actor.id).maybeSingle();
  return data?.role === "admin" ? actor.id : null;
}
