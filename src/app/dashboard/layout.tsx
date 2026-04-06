import { createServerClient } from '@/lib/pb-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/journey', label: 'My Journey', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { href: '/dashboard/brand-profile', label: 'Brand Profile', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/resources', label: 'Resources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', hasNotification: true },
  { href: '/dashboard/calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { href: '/dashboard/slack', label: 'Slack', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pb = await createServerClient();
  if (!pb.authStore.isValid) redirect('/login');

  const userId = pb.authStore.record?.id;
  let clientName = '';
  let company = '';
  let unseenResources = 0;

  try {
    const adminPb = (await import('@/lib/pb-server')).createAdminClient;
    const admin = await adminPb();
    const clients = await admin.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients[0]) {
      clientName = clients[0].name || '';
      company = clients[0].company || '';
      // Check unseen resources
      try {
        const assignments = await admin.collection('resource_assignments').getFullList({
          filter: `client_id = "${clients[0].id}" && seen_at = null`,
        });
        unseenResources = assignments.length;
      } catch {}
    }
  } catch {}

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[#0A1210] md:flex md:flex-col">
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Rawgrowth</p>
          <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.35)]">Client Portal</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[rgba(255,255,255,0.6)] transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
              <span>{item.label}</span>
              {item.hasNotification && unseenResources > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#0CBF6A] text-[10px] font-bold text-white">{unseenResources}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[rgba(255,255,255,0.06)] p-4">
          <p className="text-sm text-[rgba(255,255,255,0.7)]">{clientName}</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">{company}</p>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[rgba(255,255,255,0.06)] bg-[#0A1210]/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1 px-3 py-1 text-[rgba(255,255,255,0.5)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon}/></svg>
            <span className="text-[10px]">{item.label}</span>
            {item.hasNotification && unseenResources > 0 && (
              <span className="absolute -right-0.5 top-0 h-2 w-2 rounded-full bg-[#0CBF6A]" />
            )}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
