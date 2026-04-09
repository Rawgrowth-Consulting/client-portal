import { cookies } from "next/headers";
import { convex } from "./convex-server";
import { api } from "../../convex/_generated/api";
import { redirect } from "next/navigation";
import type { Id } from "../../convex/_generated/dataModel";

export async function getAuthUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("convex_auth");
  if (!authCookie?.value) return null;
  try {
    const { model } = JSON.parse(authCookie.value);
    if (!model?.id) return null;
    return model;
  } catch {
    return null;
  }
}

export async function getAuthenticatedClient() {
  try {
    const user = await getAuthUser();
    if (!user) return null;

    const client = await convex.query(api.clients.get, {
      clientId: user.id as Id<"clients">,
    });

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

  const client = await convex.query(api.clients.get, {
    clientId: user.id as Id<"clients">,
  });

  if (!client) redirect("/login");
  if (client.role !== "admin") redirect("/dashboard");
  return { client };
}

export function getOnboardingRedirect(client: { onboardingCompletedAt?: number; onboardingStep?: number }): string {
  if (client.onboardingCompletedAt) return "/dashboard";
  const step = client.onboardingStep || 1;
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
