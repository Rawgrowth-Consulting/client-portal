'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Client, ApiIntegration } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Plug, Bell } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

export default function SettingsPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    deliverableUpdates: true,
    newResources: true,
    callReminders: true,
    weeklyDigest: false,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/client/profile');
      const data = await res.json();
      if (data.client) {
        setClient(data.client);
        setName(data.client.name || '');
        setCompany(data.client.company || '');

        try {
          const intRes = await fetch(`/api/onboarding/api-keys?client_id=${data.client.id}`);
          const intData = await intRes.json();
          if (intData.integrations) {
            setIntegrations(intData.integrations);
          }
        } catch {}
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {} finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#0CBF6A]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Account Settings" />

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
        {/* Profile Section */}
        <div
          className="relative overflow-hidden rounded-xl p-6"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.2), transparent)',
            }}
          />

          <h3
            className="mb-5 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Profile
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-[#0CBF6A]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Email
              </label>
              <input
                type="email"
                value={client?.email || ''}
                disabled
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              />
              <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Contact your team to change your email address.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-[#0CBF6A]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-shine rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: '#0CBF6A', color: '#fff' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#0CBF6A' }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>

        </TabsContent>

        <TabsContent value="integrations">
        {/* Connected Platforms */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3
            className="mb-1 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Connected Platforms
          </h3>
          <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            API keys and integrations managed by your AI department.
          </p>

          {integrations.length === 0 ? (
            <div
              className="rounded-lg p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                No integrations connected yet. These are configured during onboarding.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-semibold"
                      style={{ background: 'rgba(12,191,106,0.08)', color: '#0CBF6A' }}
                    >
                      {integration.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {integration.platform}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {integration.key_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-xs tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {integration.key_hint || '****'}
                    </span>
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: '#0CBF6A' }}
                      title="Connected"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </TabsContent>

        <TabsContent value="notifications">
        {/* Notification Preferences */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3
            className="mb-1 text-xs font-medium uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Notification Preferences
          </h3>
          <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Control what updates you receive.
          </p>

          <div className="space-y-3">
            {([
              {
                key: 'deliverableUpdates' as const,
                label: 'Deliverable Updates',
                desc: 'Get notified when deliverables are completed',
              },
              {
                key: 'newResources' as const,
                label: 'New Resources',
                desc: 'Alerts when your team pushes new resources',
              },
              {
                key: 'callReminders' as const,
                label: 'Call Reminders',
                desc: 'Reminders before scheduled milestone calls',
              },
              {
                key: 'weeklyDigest' as const,
                label: 'Weekly Digest',
                desc: 'Summary of activity and progress each week',
              },
            ]).map((pref) => (
              <label
                key={pref.key}
                className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {pref.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {pref.desc}
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifications[pref.key]}
                    onChange={(e) =>
                      setNotifications((prev) => ({ ...prev, [pref.key]: e.target.checked }))
                    }
                    className="sr-only"
                  />
                  <div
                    className="h-6 w-10 rounded-full transition-colors"
                    style={{
                      background: notifications[pref.key] ? '#0CBF6A' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="h-4 w-4 rounded-full bg-white transition-transform"
                      style={{
                        transform: notifications[pref.key]
                          ? 'translateX(22px) translateY(4px)'
                          : 'translateX(4px) translateY(4px)',
                      }}
                    />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
