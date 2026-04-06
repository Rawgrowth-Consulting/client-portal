'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  client: any;
  unseenResourceCount: number;
  children: React.ReactNode;
}

// Inline SVG icons (Lucide style, 20x20, strokeWidth 1.5)
const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  journey: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  brand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  resources: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  calls: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  slack: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="13" y="2" width="3" height="8" rx="1.5" />
      <path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5" />
      <rect x="8" y="14" width="3" height="8" rx="1.5" />
      <path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5" />
      <rect x="14" y="13" width="8" height="3" rx="1.5" />
      <path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5" />
      <rect x="2" y="8" width="8" height="3" rx="1.5" />
      <path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5" />
    </svg>
  ),
  activity: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: icons.home },
  { label: 'My Journey', href: '/dashboard/journey', icon: icons.journey },
  { label: 'Brand Profile', href: '/dashboard/brand-profile', icon: icons.brand },
  { label: 'Resources', href: '/dashboard/resources', icon: icons.resources },
  { label: 'Calls', href: '/dashboard/calls', icon: icons.calls },
  { label: 'Slack', href: '/dashboard/slack', icon: icons.slack },
  { label: 'Activity', href: '/dashboard/activity', icon: icons.activity },
  { label: 'Settings', href: '/dashboard/settings', icon: icons.settings },
];

export default function DashboardShell({ client, unseenResourceCount, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const companyName = client?.company_name || client?.name || 'Dashboard';
  const initials = companyName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen" style={{ background: '#060B08' }}>
      {/* Noise texture is handled by body::before in globals.css */}

      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r lg:flex"
        style={{ background: '#060B08', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Top glow */}
        <div
          className="pointer-events-none absolute -top-[200px] left-1/2 h-[400px] w-[500px] -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse, rgba(12,191,106,.06) 0%, transparent 70%)' }}
        />

        {/* Logo area */}
        <div className="relative flex items-center gap-3 px-6 py-6">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(12,191,106,0.1)', color: '#0CBF6A' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {companyName}
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Client Portal
            </p>
          </div>
        </div>

        <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(12,191,106,0.08)' : 'transparent',
                  color: active ? '#0CBF6A' : 'rgba(255,255,255,0.5)',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <div
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r"
                    style={{ background: '#0CBF6A' }}
                  />
                )}
                <span
                  className="transition-colors"
                  style={{ color: active ? '#0CBF6A' : 'rgba(255,255,255,0.35)' }}
                >
                  {item.icon}
                </span>
                <span className="transition-colors group-hover:text-white">{item.label}</span>

                {/* Notification dot for Resources */}
                {item.href === '/dashboard/resources' && unseenResourceCount > 0 && (
                  <span
                    className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
                    style={{ background: '#0CBF6A', color: '#fff' }}
                  >
                    {unseenResourceCount > 99 ? '99+' : unseenResourceCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-6">
          <div className="mx-auto h-px mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex items-center gap-3 px-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              {(client?.contact_name || client?.name || 'U')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {client?.contact_name || client?.name || 'User'}
              </p>
              <p className="truncate text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {client?.contact_email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div
        className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b px-4 lg:hidden"
        style={{ background: '#060B08', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-semibold"
            style={{ background: 'rgba(12,191,106,0.1)', color: '#0CBF6A' }}
          >
            {initials}
          </div>
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {companyName}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? icons.close : icons.menu}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out menu */}
      <div
        className="fixed right-0 top-0 z-50 flex h-screen w-[280px] flex-col border-l transition-transform duration-300 lg:hidden"
        style={{
          background: '#060B08',
          borderColor: 'rgba(255,255,255,0.06)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Menu
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Close menu"
          >
            {icons.close}
          </button>
        </div>

        <nav className="flex-1 px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(12,191,106,0.08)' : 'transparent',
                  color: active ? '#0CBF6A' : 'rgba(255,255,255,0.5)',
                }}
              >
                <span style={{ color: active ? '#0CBF6A' : 'rgba(255,255,255,0.35)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.href === '/dashboard/resources' && unseenResourceCount > 0 && (
                  <span
                    className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
                    style={{ background: '#0CBF6A', color: '#fff' }}
                  >
                    {unseenResourceCount > 99 ? '99+' : unseenResourceCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex items-center gap-3 px-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              {(client?.contact_name || client?.name || 'U')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {client?.contact_name || client?.name || 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="relative min-h-screen w-full lg:pl-[260px]">
        {/* Top radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse, rgba(12,191,106,.03) 0%, transparent 65%)' }}
        />

        {/* Mobile top padding */}
        <div className="pt-14 lg:pt-0">
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
