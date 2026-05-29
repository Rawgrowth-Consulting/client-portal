'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, Settings, ChevronUp } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/journey', label: 'My Journey', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { href: '/dashboard/brand-profile', label: 'Automation Map', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/impact', label: 'Impact', icon: 'M3 3v18h18M7 14l4-4 4 4 6-6' },
  { href: '/dashboard/resources', label: 'Resources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/dashboard/calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const clientName = session?.user?.name || '';
  const clientEmail = session?.user?.email || '';
  const initials = (clientName || clientEmail || 'U')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  function handleSignOut() {
    signOut({ callbackUrl: '/login' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#060B08]">
      {/* Sidebar - truly fixed, never scrolls with page */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0A1210] md:flex">
        <div className="flex shrink-0 items-center gap-3 p-6">
          <Image
            src="/rawgrowth.png"
            alt="Rawgrowth"
            width={32}
            height={32}
            priority
            className="h-8 w-8 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[rgba(255,255,255,0.92)]">Rawgrowth</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)]">Client Portal</p>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-3">
          <nav className="space-y-0.5 pb-3">
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
        </ScrollArea>

        <div className="shrink-0 border-t border-[rgba(255,255,255,0.06)] p-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                aria-label="Open account menu"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(12,191,106,0.1)] text-xs font-semibold text-[#0CBF6A]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[rgba(255,255,255,0.85)]">
                    {clientName || 'Account'}
                  </p>
                  <p className="truncate text-xs text-[rgba(255,255,255,0.4)]">
                    {clientEmail}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.4)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-60"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {clientName || 'Account'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {clientEmail}
                </p>
              </div>
              <div className="p-1">
                <Link
                  href="/dashboard/settings"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span>Sign out</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Mobile bottom nav */}
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

      {/* Main content - the only thing that scrolls */}
      <main className="relative flex-1 min-w-0">
        <ScrollArea className="h-full">
          <div className="w-full px-6 py-8 pb-24 md:px-8 md:py-10 md:pb-10">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
