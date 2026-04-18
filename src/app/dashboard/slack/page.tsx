'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';

interface SlackMessage {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

export default function SlackPage() {
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasChannel, setHasChannel] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/slack/messages');
      const data = await res.json();

      if (data.fallback) {
        setHasChannel(false);
        setLoading(false);
        return;
      }

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function formatTimestamp(ts: string) {
    const date = new Date(parseFloat(ts) * 1000);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  if (!hasChannel) {
    return (
      <div>
        <PageHeader eyebrow="Slack" title="Team Channel" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] py-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <p className="mt-4 text-sm text-[rgba(255,255,255,0.5)]">Your Slack channel hasn't been connected yet.</p>
          <a href="https://rawgrowth.slack.com" target="_blank" rel="noopener noreferrer" className="mt-4 btn-shine inline-flex items-center gap-2 rounded-xl bg-[#0CBF6A] px-6 py-3 text-sm font-bold text-white">
            Open in Slack
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Slack" title="Team Channel">
        <a
          href="https://rawgrowth.slack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-[rgba(255,255,255,0.12)] px-4 py-2 text-xs font-medium text-[rgba(255,255,255,0.6)] hover:text-white"
        >
          Open in Slack
        </a>
      </PageHeader>

      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-4" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0CBF6A] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-400">{error}</div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-sm text-[rgba(255,255,255,0.4)]">No messages yet.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(12,191,106,0.1)] text-xs font-medium text-[#0CBF6A]">
                  {getInitials(msg.user)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{msg.user}</span>
                    <span className="text-[10px] text-[rgba(255,255,255,0.25)]">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-[rgba(255,255,255,0.6)] break-words">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[10px] text-[rgba(255,255,255,0.2)]">Updates every 30 seconds</p>
    </div>
  );
}
