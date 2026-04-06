import { getAuthUser, createAdminClient } from './pb-server';
import { redirect } from 'next/navigation';
import type { Client } from '@/types';

export async function getAuthenticatedClient(): Promise<{ pb: any; client: Client } | null> {
  try {
    const user = await getAuthUser();
    if (!user) return null;

    const userId = user.id;
    const pb = await createAdminClient();

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
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const pb = await createAdminClient();
  const clients = await pb.collection('clients').getFullList({
    filter: `user_id = "${user.id}"`,
  });
  if (clients.length === 0) redirect('/login');
  const client = clients[0] as unknown as Client;
  if (client.role !== 'admin') redirect('/dashboard');
  return { pb, client };
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
