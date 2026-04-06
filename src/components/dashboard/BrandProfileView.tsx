'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { BrandProfile } from '@/types'

interface BrandProfileViewProps {
  profile: BrandProfile | null
}

export default function BrandProfileView({ profile }: BrandProfileViewProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmitFeedback() {
    if (!feedback.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/brand-profile/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send feedback')
      }

      setSent(true)
      setFeedback('')
      setShowFeedback(false)
      setTimeout(() => setSent(false), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!profile) {
    return (
      <div
        className="relative overflow-hidden rounded-xl p-12 text-center"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Your brand profile is being generated
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          This usually takes 24-48 hours after onboarding completes.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Status bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
            style={{
              background:
                profile.status === 'approved'
                  ? 'rgba(12,191,106,0.1)'
                  : profile.status === 'ready'
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(255,255,255,0.04)',
              color:
                profile.status === 'approved'
                  ? '#0CBF6A'
                  : profile.status === 'ready'
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.4)',
            }}
          >
            {profile.status === 'approved'
              ? 'Approved'
              : profile.status === 'ready'
              ? 'Ready for Review'
              : 'Generating'}
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Version {profile.version}
          </span>
          {profile.generated_at && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Generated{' '}
              {new Date(profile.generated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="btn-shine rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ background: '#0CBF6A', color: '#fff' }}
        >
          Request Update
        </button>
      </div>

      {/* Success toast */}
      {sent && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            background: 'rgba(12,191,106,0.1)',
            border: '1px solid rgba(12,191,106,0.2)',
            color: '#0CBF6A',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Feedback sent. Your team will review and update the profile.
        </div>
      )}

      {/* Feedback form */}
      {showFeedback && (
        <div
          className="mb-4 rounded-xl p-5"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p
            className="mb-3 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            What needs updating?
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe what changed or what feels off..."
            rows={4}
            className="w-full resize-none rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1 focus:ring-[#0CBF6A]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
          />
          {error && (
            <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSubmitFeedback}
              disabled={sending || !feedback.trim()}
              className="btn-shine rounded-lg px-5 py-2 text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: '#0CBF6A', color: '#fff' }}
            >
              {sending ? 'Sending...' : 'Send Feedback'}
            </button>
            <button
              onClick={() => {
                setShowFeedback(false)
                setFeedback('')
                setError('')
              }}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile content */}
      <div
        className="relative overflow-hidden rounded-xl p-8"
        style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)',
          }}
        />

        {profile.status === 'generating' ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#0CBF6A]" />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Generating your brand profile...
            </p>
          </div>
        ) : (
          <div className="prose-portal">
            <ReactMarkdown>{profile.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
