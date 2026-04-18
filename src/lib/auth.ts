import { auth } from "./auth-config";
import { supabase } from "./supabase";
import { redirect } from "next/navigation";

export async function getAuthUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function getAuthenticatedClient() {
  try {
    const user = await getAuthUser();
    if (!user) return null;

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!client) return null;
    return { client };
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
