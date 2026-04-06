'use client';

import { useState, useEffect, useCallback } from 'react';

interface ActivityEvent {
  id: string;
  client_id: string;
  event_type: string;
  title: string;
  description: string | null;
  agent_name: string;
  metadata: Record<string, any>;
  severity: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read_at: string | null;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  appointment_booked: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ticket_resolved: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  task_completed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17L4 12" />
    </svg>
  ),
  anomaly_flagged: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  content_published: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  report_generated: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  workflow_triggered: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  system_update: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  email_sent: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  milestone_reached: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

const SEVERITY_COLORS: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
  info: {
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.15)',
    dot: '#3B82F6',
    icon: '#3B82F6',
  },
  success: {
    bg: 'rgba(12,191,106,0.06)',
    border: 'rgba(12,191,106,0.15)',
    dot: '#0CBF6A',
    icon: '#0CBF6A',
  },
  warning: {
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.15)',
    dot: '#F59E0B',
    icon: '#F59E0B',
  },
  error: {
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.15)',
    dot: '#ef4444',
    icon: '#ef4444',
  },
};

const EVENT_LABELS: Record<string, string> = {
  appointment_booked: 'Appointment',
  ticket_resolved: 'Ticket Resolved',
  task_completed: 'Task Done',
  anomaly_flagged: 'Anomaly',
  content_published: 'Published',
  report_generated: 'Report',
  workflow_triggered: 'Workflow',
  system_update: 'System',
  email_sent: 'Email',
  milestone_reached: 'Milestone',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ActivityFeedProps {
  compact?: boolean;
  maxItems?: number;
  showFilters?: boolean;
}

export default function ActivityFeed({ compact = false, maxItems, showFilters = true }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (maxItems) params.set('limit', String(maxItems));
      if (filter) params.set('type', filter);

      const res = await fetch(`/api/activity-feed?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setEvents(data.events || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch activity feed:', err);
    } finally {
      setLoading(false);
    }
  }, [maxItems, filter]);

  useEffect(() => {
    fetchEvents();
    // Poll every 30 seconds for new events
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const markAsRead = async (eventIds: string[]) => {
    try {
      await fetch('/api/activity-feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: eventIds }),
      });
      setEvents(prev =>
        prev.map(e => eventIds.includes(e.id) ? { ...e, read_at: new Date().toISOString() } : e)
      );
      setUnreadCount(prev => Math.max(0, prev - eventIds.length));
    } catch {}
  };

  const filters = [
    { key: null, label: 'All' },
    { key: 'appointment_booked', label: 'Appointments' },
    { key: 'ticket_resolved', label: 'Tickets' },
    { key: 'task_completed', label: 'Tasks' },
    { key: 'anomaly_flagged', label: 'Anomalies' },
    { key: 'content_published', label: 'Content' },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-lg bg-[rgba(255,255,255,0.03)] p-4">
            <div className="h-3 w-2/3 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="mt-2 h-2 w-1/3 rounded bg-[rgba(255,255,255,0.04)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && !compact && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.key || 'all'}
              onClick={() => setFilter(f.key)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? 'rgba(12,191,106,0.12)' : 'rgba(255,255,255,0.04)',
                color: filter === f.key ? '#0CBF6A' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${filter === f.key ? 'rgba(12,191,106,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Unread badge */}
      {unreadCount > 0 && !compact && (
        <button
          onClick={() => markAsRead(events.filter(e => !e.read_at).map(e => e.id))}
          className="mb-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-110"
          style={{ background: 'rgba(12,191,106,0.08)', color: '#0CBF6A' }}
        >
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0CBF6A] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
          new events -- mark all read
        </button>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="rounded-lg bg-[rgba(255,255,255,0.02)] px-4 py-8 text-center">
          <p className="text-sm text-[rgba(255,255,255,0.35)]">No activity yet. Your AI department will log actions here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {events.map(event => {
            const colors = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
            const icon = EVENT_ICONS[event.event_type] || EVENT_ICONS.system_update;
            const isExpanded = expandedId === event.id;
            const isUnread = !event.read_at;

            return (
              <div
                key={event.id}
                onClick={() => {
                  setExpandedId(isExpanded ? null : event.id);
                  if (isUnread) markAsRead([event.id]);
                }}
                className="group cursor-pointer rounded-lg transition-all"
                style={{
                  background: isExpanded ? colors.bg : isUnread ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: `1px solid ${isExpanded ? colors.border : 'transparent'}`,
                }}
              >
                <div className="flex items-start gap-3 px-3 py-2.5">
                  {/* Icon */}
                  <div
                    className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ background: colors.bg, color: colors.icon }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: colors.dot }} />
                          )}
                          <p
                            className="truncate text-sm"
                            style={{
                              color: isUnread ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)',
                              fontWeight: isUnread ? 500 : 400,
                            }}
                          >
                            {event.title}
                          </p>
                        </div>
                        {!compact && (
                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}
                            >
                              {event.agent_name}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {EVENT_LABELS[event.event_type] || event.event_type}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[11px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {timeAgo(event.created_at)}
                      </span>
                    </div>

                    {/* Expanded description */}
                    {isExpanded && event.description && (
                      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
