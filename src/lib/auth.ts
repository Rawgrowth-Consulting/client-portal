import { createServerClient } from './pb-server';
import { redirect } from 'next/navigation';
import type { Client } from '@/types';

export async function getAuthenticatedClient(): Promise<{ pb: any; client: Client } | null> {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return null;

    const userId = pb.authStore.record?.id;
    if (!userId) return null;

    const clients = await pb.collection('clients').getFullList({
      filter: `user_id = "${userId}"`,
    });

    if (clients.length === 0) return null;
    return { pb, client: clients[0] as unknown as Client };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<{ pb: any; client: Client }> {
  const result = await getAuthenticatedClient();
  if (!result) redirect('/login');
  return result;
}

export async function requireAdmin(): Promise<{ pb: any; client: Client }> {
  const result = await requireAuth();
  if (result.client.role !== 'admin') redirect('/dashboard');
  return result;
}

export function getOnboardingRedirect(client: Client): string {
  if (client.onboarding_completed_at) return '/dashboard';
  const step = client.onboarding_step || 1;
  const stepNames: Record<number, string> = {
    1: '1-welcome',
    2: '2-questionnaire',
    3: '3-brand-profile',
    4: '4-brand-docs',
    5: '5-api-keys',
    6: '6-software-access',
    7: '7-schedule-calls',
    8: '8-complete',
  };
  return `/onboarding/${stepNames[step] || '1-welcome'}`;
}
