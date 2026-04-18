'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, ChevronUp } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Clients', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75' },
  { href: '/admin/resources/new', label: 'Resources', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/admin/flow', label: 'Flow Map', icon: 'M6 3v12 M18 9a3 3 0 100-6 3 3 0 000 6z M6 21a3 3 0 100-6 3 3 0 000 6z M18 21a3 3 0 100-6 3 3 0 000 6z M18 9v3a3 3 0 01-3 3H9 M6 15v0' },
];

interface AdminShellProps {
  user: { name: string; email: string };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  const name = user.name || '';
  const email = user.email || '';
  const initials = (name || email || 'A')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  function handleSignOut() {
    signOut({ callbackUrl: '/login' });
  }

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#060B08]">
      {/* Sidebar */}
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
            <p className="text-sm font-semibold text-[rgba(255,255,255,0.92)]">
              Rawgrowth
            </p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
              Admin Portal
            </p>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(12,191,106,0.12)', color: '#0CBF6A' }}
          >
            Admin
          </span>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-3">
          <nav className="space-y-0.5 pb-3">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-[rgba(12,191,106,0.08)] text-white'
                      : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.03)] hover:text-white'
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
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
                    {name || 'Admin'}
                  </p>
                  <p className="truncate text-xs text-[rgba(255,255,255,0.4)]">
                    {email}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.4)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" sideOffset={8} className="w-60">
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {name || 'Admin'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <div className="p-1">
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
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 ${active ? 'text-[#0CBF6A]' : 'text-[rgba(255,255,255,0.5)]'}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="relative min-w-0 flex-1">
        <ScrollArea className="h-full">
          <div className="w-full px-6 py-8 pb-24 md:px-8 md:py-10 md:pb-10">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
