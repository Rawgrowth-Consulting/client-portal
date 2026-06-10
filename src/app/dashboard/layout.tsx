import { redirect } from 'next/navigation';
import { getEffectiveUser } from '@/lib/auth';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const eff = await getEffectiveUser();
  if (!eff) redirect('/login');
  // A real admin (not impersonating) belongs in /admin. An impersonating admin
  // resolves to the target client, so this guard lets them through.
  if (eff.effective.role === 'admin' && !eff.impersonating) redirect('/admin');

  return (
    <>
      {eff.impersonating && <ImpersonationBanner targetName={eff.effective.name} />}
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
