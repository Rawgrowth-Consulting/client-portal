'use client';

import { useState, useCallback } from 'react';
import type { BrandProfile } from '@/types';

export function BrandProfileEditor({
  profile,
  clientId,
}: {
  profile: BrandProfile;
  clientId: string;
}) {
  const [content, setContent] = useState(profile.content);
  const [status, setStatus] = useState(profile.status);
  const [version, setVersion] = useState(profile.version);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState('');

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          clientId,
          content,
          action: 'save',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      showMessage('Draft saved.');
    } catch {
      showMessage('Failed to save.');
    }
    setSaving(false);
  }

  async function approveAndPublish() {
    setApproving(true);
    try {
      const res = await fetch('/api/admin/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          clientId,
          content,
          action: 'approve',
        }),
      });
      if (!res.ok) throw new Error('Approve failed');
      setStatus('approved');
      setVersion((v) => v + 1);
      showMessage('Approved and published.');
    } catch {
      showMessage('Failed to approve.');
    }
    setApproving(false);
  }

  // Simple markdown to HTML (handles headers, bold, italic, lists, blockquotes, hr)
  function renderMarkdown(md: string): string {
    return md
      .split('\n')
      .map((line) => {
        if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith('> ')) return `<blockquote>${line.slice(2)}</blockquote>`;
        if (line.startsWith('---') || line.startsWith('***')) return '<hr />';
        if (line.startsWith('- ') || line.startsWith('* '))
          return `<li>${line.slice(2)}</li>`;
        if (line.trim() === '') return '<br />';
        return `<p>${line}</p>`;
      })
      .join('\n')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  return (
    <div>
      {/* Action bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Version {version}
          </span>
          {message && (
            <span className="text-xs font-medium" style={{ color: '#0CBF6A' }}>
              {message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-xs font-medium transition-colors hover:border-[rgba(12,191,106,0.4)] disabled:opacity-50"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={approveAndPublish}
            disabled={approving}
            className="btn-shine rounded-lg bg-[#0CBF6A] px-4 py-2 text-xs font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {approving ? 'Approving...' : 'Approve and Publish'}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)' }}
          />
          <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Editor
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Markdown
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-[600px] w-full resize-none p-4 text-sm leading-relaxed outline-none"
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: '#0A1210', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(to right, transparent, rgba(12,191,106,0.3), transparent)' }}
          />
          <div className="flex items-center border-b px-4 py-2.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Preview
            </span>
          </div>
          <div
            className="prose-portal h-[600px] overflow-y-auto p-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </div>
  );
}
