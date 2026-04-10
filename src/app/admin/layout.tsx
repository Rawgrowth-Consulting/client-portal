import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen" style={{ background: '#060B08' }}>
      <header className="sticky top-0 z-50 border-b" style={{ background: '#0A1210', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center">
              <Image
                src="/logo-white.webp"
                alt="Rawgrowth"
                width={120}
                height={41}
                priority
                className="h-7 w-auto object-contain"
              />
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white transition-colors">All Clients</Link>
              <Link href="/admin/invites" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white transition-colors">Invites</Link>
              <Link href="/admin/resources/new" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white transition-colors">Resources</Link>
              <Link href="/admin/flow" className="text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white transition-colors">Flow Map</Link>
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
