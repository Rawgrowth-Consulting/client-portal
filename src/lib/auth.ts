import { auth } from "./auth-config";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { getActiveImpersonationSession, type ImpersonationSession } from "@/lib/impersonation";
import { redirect } from "next/navigation";

type AuthUser = { id: string; email: string; name: string; role: string };

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

// Resolves the principal the app should act as. `actual` is always the logged-in
// user; `effective` is the impersonated client when an admin has an active
// impersonation session, otherwise it equals `actual`.
export async function getEffectiveUser(): Promise<
  { actual: AuthUser; effective: AuthUser; impersonating: ImpersonationSession | null } | null
> {
  const actual = await getAuthUser();
  if (!actual) return null;

  if (actual.role === "admin") {
    const session = await getActiveImpersonationSession();
    if (session) {
      const { data: target } = await supabase
        .from("clients")
        .select("id, email, name, role")
        .eq("id", session.client_id)
        .maybeSingle();
      if (target) {
        return {
          actual,
          effective: {
            id: target.id,
            email: target.email,
            name: target.name,
            role: target.role,
          },
          impersonating: session,
        };
      }
    }
  }

  return { actual, effective: actual, impersonating: null };
}

export async function getAuthenticatedClient() {
  try {
    const eff = await getEffectiveUser();
    if (!eff) return null;

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", eff.effective.id)
      .single();

    if (!client) return null;
    return { client, impersonating: eff.impersonating, actual: eff.actual };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const result = await getAuthenticatedClient();
  if (!result) redirect("/login");
  return result;
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!client) redirect("/login");
  if (client.role !== "admin") redirect("/dashboard");
  return { client };
}

export function getOnboardingRedirect(client: { status?: string; onboarding_step?: number }): string {
  if (client.status === "active") return "/dashboard";
  const step = client.onboarding_step || 1;
  const stepNames: Record<number, string> = {
    1: "1-welcome",
    2: "2-questionnaire",
    3: "3-brand-profile",
    4: "4-brand-docs",
    5: "5-api-keys",
    6: "6-software-access",
    7: "7-schedule-calls",
    8: "8-complete",
  };
  return `/onboarding/${stepNames[step] || "1-welcome"}`;
}
