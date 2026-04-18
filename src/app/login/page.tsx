import { redirect } from 'next/navigation';

import { getAuthUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getAuthUser();

  if (user) {
    // Admin goes to /admin, otherwise route based on onboarding status.
    if (user.role === 'admin') {
      redirect('/admin');
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();

    if (client?.status === 'active') {
      redirect('/dashboard');
    }
    redirect('/onboarding');
  }

  return <LoginForm />;
}
