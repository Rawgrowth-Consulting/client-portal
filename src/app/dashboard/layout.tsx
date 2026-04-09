'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/journey', label: 'My Journey', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { href: '/dashboard/brand-profile', label: 'Brand Profile', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/resources', label: 'Resources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/dashboard/calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('rg_client_id');
    if (!id) {
      router.push('/');
      return;
    }
    setClientId(id);
  }, [router]);

  const client = useQuery(
    api.clients.get,
    clientId ? { clientId: clientId as Id<'clients'> } : 'skip'
  );

  if (!clientId) return null;

  const clientName = client?.name || '';
  const company = client?.company || '';

  return (
    <div className="flex min-h-screen bg-[#060B08]">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[#0A1210] md:flex md:flex-col">
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">Rawgrowth</p>
          <p className="mt-0.5 text-xs text-[rgba(255,255,255,0.35)]">Client Portal</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-[rgba(12,191,106,0.08)] text-white'
                    : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(255,255,255,0.06)] p-4">
          <p className="text-sm text-[rgba(255,255,255,0.7)]">{clientName}</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">{company}</p>
          <button
            onClick={() => { localStorage.removeItem('rg_client_id'); router.push('/'); }}
            className="mt-2 text-xs text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)]"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[rgba(255,255,255,0.06)] bg-[#0A1210]/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-1 px-3 py-1 ${isActive ? 'text-[#0CBF6A]' : 'text-[rgba(255,255,255,0.5)]'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={item.icon}/></svg>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
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
