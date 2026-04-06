import { getAuthUser } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen" style={{ background: '#060B08' }}>
      <header className="sticky top-0 z-50 border-b" style={{ background: '#0A1210', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: '#0CBF6A' }}>R</div>
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Rawgrowth Admin</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white">All Clients</Link>
              <Link href="/admin/resources/new" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white">Resources</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(12,191,106,0.12)', color: '#0CBF6A' }}>Admin</span>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{user.name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
    </div>
  );
}
