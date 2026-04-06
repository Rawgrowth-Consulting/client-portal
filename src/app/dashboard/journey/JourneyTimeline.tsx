'use client'

import { useState } from 'react'
import type { Deliverable } from '@/types'

interface MonthPlan {
  label: string
  focus: string
}

interface JourneyTimelineProps {
  deliverables: Deliverable[]
  monthPlan: Record<number, MonthPlan>
  currentMonth: number
  currentWeek: number
}

export default function JourneyTimeline({
  deliverables,
  monthPlan,
  currentMonth,
  currentWeek,
}: JourneyTimelineProps) {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({
    [currentMonth]: true,
  })

  function toggleMonth(month: number) {
    setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }))
  }

  function getMonthDeliverables(month: number) {
    return deliverables.filter((d) => d.month === month)
  }

  function getWeekDeliverables(month: number, week: number) {
    return deliverables.filter((d) => d.month === month && d.week === week)
  }

  function getMonthProgress(month: number) {
    const items = getMonthDeliverables(month)
    if (items.length === 0) return 0
    const completed = items.filter((d) => d.completed).length
    return Math.round((completed / items.length) * 100)
  }

  function getMonthStatus(month: number): 'completed' | 'current' | 'upcoming' {
    if (month < currentMonth) return 'completed'
    if (month === currentMonth) return 'current'
    return 'upcoming'
  }

  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((month) => {
        const plan = monthPlan[month]
        const isExpanded = expandedMonths[month]
        const status = getMonthStatus(month)
        const progress = getMonthProgress(month)
        const monthItems = getMonthDeliverables(month)

        return (
          <div key={month}>
            {/* Month card */}
            <button
              onClick={() => toggleMonth(month)}
              className="w-full text-left"
            >
              <div
                className="relative overflow-hidden rounded-xl p-5 transition-all"
                style={{
                  background: '#0A1210',
                  border: status === 'current'
                    ? '1px solid rgba(12,191,106,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Top accent line */}
                {status === 'current' && (
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background:
                        'linear-gradient(to right, transparent, rgba(12,191,106,0.5), transparent)',
                    }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold"
                      style={{
                        background:
                          status === 'completed'
                            ? 'rgba(12,191,106,0.15)'
                            : status === 'current'
                            ? 'rgba(12,191,106,0.1)'
                            : 'rgba(255,255,255,0.04)',
                        color:
                          status === 'upcoming'
                            ? 'rgba(255,255,255,0.35)'
                            : '#0CBF6A',
                      }}
                    >
                      {status === 'completed' ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        month
                      )}
                    </div>

                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'rgba(255,255,255,0.92)' }}
                      >
                        {plan?.label || `Month ${month}`}
                      </p>
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {plan?.focus || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    {monthItems.length > 0 && (
                      <div className="hidden items-center gap-2 sm:flex">
                        <div
                          className="h-1.5 w-24 overflow-hidden rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              background: '#0CBF6A',
                            }}
                          />
                        </div>
                        <span
                          className="text-xs tabular-nums"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {progress}%
                        </span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span
                      className="rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        background:
                          status === 'current'
                            ? 'rgba(12,191,106,0.1)'
                            : status === 'completed'
                            ? 'rgba(12,191,106,0.06)'
                            : 'rgba(255,255,255,0.03)',
                        color:
                          status === 'current'
                            ? '#0CBF6A'
                            : status === 'completed'
                            ? 'rgba(12,191,106,0.6)'
                            : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {status === 'current' ? 'In Progress' : status === 'completed' ? 'Done' : 'Upcoming'}
                    </span>

                    {/* Chevron */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-200"
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded weeks */}
            {isExpanded && (
              <div className="ml-5 mt-1 space-y-1 border-l pl-6 pt-2 pb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {[1, 2, 3, 4].map((week) => {
                  const weekItems = getWeekDeliverables(month, week)
                  const isCurrentWeek = month === currentMonth && week === currentWeek

                  return (
                    <div
                      key={week}
                      className="relative rounded-lg p-4"
                      style={{
                        background: isCurrentWeek
                          ? 'rgba(12,191,106,0.04)'
                          : 'transparent',
                        border: isCurrentWeek
                          ? '1px solid rgba(12,191,106,0.2)'
                          : '1px solid transparent',
                      }}
                    >
                      {/* Connection dot */}
                      <div
                        className="absolute -left-[25px] top-5 h-2 w-2 rounded-full"
                        style={{
                          background: isCurrentWeek
                            ? '#0CBF6A'
                            : 'rgba(255,255,255,0.15)',
                        }}
                      />

                      <div className="flex items-center gap-2 mb-2">
                        <p
                          className="text-xs font-medium"
                          style={{
                            color: isCurrentWeek
                              ? '#0CBF6A'
                              : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          Week {week}
                        </p>
                        {isCurrentWeek && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                            style={{
                              background: 'rgba(12,191,106,0.12)',
                              color: '#0CBF6A',
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>

                      {weekItems.length === 0 ? (
                        <p
                          className="text-xs italic"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          No deliverables scheduled
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {weekItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3"
                            >
                              {/* Checkbox */}
                              <div
                                className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                                style={{
                                  background: item.completed
                                    ? '#0CBF6A'
                                    : 'transparent',
                                  border: item.completed
                                    ? 'none'
                                    : '1px solid rgba(255,255,255,0.15)',
                                }}
                              >
                                {item.completed && (
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#060B08"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>

                              <div>
                                <p
                                  className="text-sm"
                                  style={{
                                    color: item.completed
                                      ? 'rgba(255,255,255,0.5)'
                                      : 'rgba(255,255,255,0.85)',
                                    textDecoration: item.completed
                                      ? 'line-through'
                                      : 'none',
                                  }}
                                >
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: 'rgba(255,255,255,0.35)' }}
                                  >
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
