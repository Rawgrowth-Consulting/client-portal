'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send magic link');

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Green radial glow */}
      <div
        className="pointer-events-none absolute -top-[200px] left-1/2 h-[1000px] w-[1200px] -translate-x-1/2"
        style={{ background: 'radial-gradient(circle, rgba(12,191,106,.07) 0%, transparent 60%)' }}
      />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(12,191,106,.12) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 10%, transparent 60%)',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 10%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
            Client Portal
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Welcome to <span className="italic text-primary">Rawgrowth</span>
          </h1>
        </div>

        <Card className="overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-2 text-lg font-medium text-foreground">
                  Check your email
                </h2>
                <p className="text-sm text-muted-foreground">
                  We sent a login link to{' '}
                  <span className="text-foreground">{email}</span>. Click it to
                  access your portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !isValidEmail}
                  className="w-full font-bold"
                >
                  {loading ? 'Sending...' : 'Send Login Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Only registered Rawgrowth clients can access this portal.
        </p>
      </div>
    </main>
  );
}
