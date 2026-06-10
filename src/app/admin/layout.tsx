import { redirect } from 'next/navigation';
import { getAuthUser, getEffectiveUser } from '@/lib/auth';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import AdminShell from './AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const eff = await getEffectiveUser();

  return (
    <>
      {eff?.impersonating && <ImpersonationBanner targetName={eff.effective.name} />}
      <AdminShell user={{ name: user.name, email: user.email }}>
        {children}
      </AdminShell>
    </>
  );
}
