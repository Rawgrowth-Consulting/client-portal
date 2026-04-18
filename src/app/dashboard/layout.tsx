import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role === 'admin') redirect('/admin');

  return <DashboardShell>{children}</DashboardShell>;
}
