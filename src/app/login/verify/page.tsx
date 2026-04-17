'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('No token provided');
      return;
    }

    async function verify() {
      try {
        // Step 1: Verify the magic link token
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        // Step 2: Create a next-auth session
        const result = await signIn('magic-link', {
          email: data.email,
          redirect: false,
        });

        if (!result?.ok) throw new Error('Failed to create session');

        setStatus('success');
        setTimeout(() => router.push(data.redirect || '/dashboard'), 1000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Verifying your login...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(12,191,106,0.15)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0CBF6A" strokeWidth="2"><path d="M20 6L9 17L4 12"/></svg>
            </div>
            <p className="text-[#0CBF6A]">Verified. Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.15)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <p className="mb-2 text-red-400">{error}</p>
            <a href="/login" className="text-sm text-[#0CBF6A] underline">Try again</a>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
