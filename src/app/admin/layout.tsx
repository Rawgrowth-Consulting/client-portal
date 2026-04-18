import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import AdminShell from './AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <AdminShell user={{ name: user.name, email: user.email }}>
      {children}
    </AdminShell>
  );
}
