'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = form.name.trim() && form.email.trim() && form.company.trim();

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[rgba(255,255,255,0.5)] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to clients
      </Link>

      <PageHeader
        eyebrow="New Client"
        title="Add a new client"
        description="Create a new client record. Once created they'll be able to request a magic-link login."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6">
          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-[rgba(255,255,255,0.4)]">
            Contact
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Chris West"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                placeholder="Rawgrowth"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="chris@company.com"
                required
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={!canSubmit || saving}>
            {saving ? 'Creating...' : 'Create client'}
          </Button>
          <Button asChild type="button" variant="ghost" size="lg">
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
