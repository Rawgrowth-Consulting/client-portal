import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/pb-server';

export default async function Home() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (!authCookie?.value) {
    redirect('/login');
  }

  // Parse the auth cookie to get user ID
  try {
    const { model } = JSON.parse(authCookie.value);
    if (!model?.id) redirect('/login');

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({
      filter: `user_id = "${model.id}"`,
    });

    if (clients.length === 0) redirect('/login');

    const client = clients[0];

    if (client.role === 'admin') redirect('/admin');
    if (client.onboarding_completed_at) redirect('/dashboard');

    // Route to current onboarding step
    const step = client.onboarding_step || 1;
    const stepPaths: Record<number, string> = {
      1: '1-welcome', 2: '2-questionnaire', 3: '3-brand-profile', 4: '4-brand-docs',
      5: '5-api-keys', 6: '6-software-access', 7: '7-schedule-calls', 8: '8-complete',
    };
    redirect(`/onboarding/${stepPaths[step] || '1-welcome'}`);
  } catch {
    redirect('/login');
  }
}
