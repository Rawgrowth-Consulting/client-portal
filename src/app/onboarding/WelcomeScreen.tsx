'use client';

import { ArrowRight, Compass, MapPin, Sparkles, Telescope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RAWGROWTH_TEAM } from '@/lib/team';

/**
 * Stage 0 — shown once before the discovery chat begins.
 * Built around the 4 elements from Charlie Morgan's high-ticket onboarding:
 *   1. Hype / reaffirm the result
 *   2. Intro the team (real faces)
 *   3. Set realistic 30-day expectations (underpromise)
 *   4. Crystal-clear next step (Begin discovery)
 * Optimised for the 3 Cs: Convenience, Clarity, Confidence.
 */

const TEAM_TINTS = [
  'rgba(12,191,106,0.18)', // green
  'rgba(59,130,246,0.18)', // blue
  'rgba(234,179,8,0.18)', // amber
  'rgba(168,85,247,0.18)', // purple
];

const TEAM_BORDERS = [
  'rgba(12,191,106,0.35)',
  'rgba(59,130,246,0.35)',
  'rgba(234,179,8,0.35)',
  'rgba(168,85,247,0.35)',
];

const TEAM_INITIAL_COLORS = ['#0CBF6A', '#60A5FA', '#FBBF24', '#C084FC'];

const ROADMAP = [
  {
    when: 'Today',
    label: 'Discovery',
    detail: "We map your business operation in full — what you sell, how every function runs, your tools, your bottlenecks. ~25–40 min.",
    icon: Compass,
  },
  {
    when: 'Days 1–3',
    label: 'Your Automation Map',
    detail: "We synthesise your answers into a ranked Business Process & Automation Map — every process, every tool, every opportunity.",
    icon: Telescope,
  },
  {
    when: 'Week 1',
    label: 'Kickoff call',
    detail: 'You walk through the map with us, approve scope, and sign off on the first agent we build.',
    icon: MapPin,
  },
  {
    when: 'Weeks 2–3',
    label: 'First agent goes live',
    detail: "Realistic, not aspirational — ~2–3 weeks per agent. We'd rather get this right than rushed.",
    icon: Sparkles,
  },
  {
    when: 'Day 30',
    label: 'Your AI department is operating',
    detail: 'Your first agents are shipping work. Impact data starts flowing into your portal.',
    icon: Sparkles,
  },
];

export default function WelcomeScreen({
  firstName,
  company,
  onBegin,
}: {
  firstName: string | null;
  company: string | null;
  onBegin: () => void;
}) {
  const name = firstName?.trim() || 'there';
  return (
    <div className="rg-fade-in flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 md:px-10 md:py-14">
        {/* Hype */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0CBF6A]">
            Welcome to Rawgrowth
          </p>
          <h1 className="mt-3 text-3xl font-medium leading-tight text-white/95 md:text-4xl">
            Hi {name} — let's install your AI department
            {company ? <span className="text-white/55"> for {company}</span> : null}.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
            The next ~30 minutes are the most valuable. You'll talk to a senior consultant
            that maps your entire business — how you operate, your tools, your bottlenecks —
            so we know exactly what to automate, and how. Everything saves as you go.
          </p>
        </header>

        {/* Team */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Your team
          </p>
          <div className="flex flex-wrap gap-3">
            {RAWGROWTH_TEAM.map((m, i) => (
              <div
                key={m.initials}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: TEAM_TINTS[i % TEAM_TINTS.length],
                    border: `1px solid ${TEAM_BORDERS[i % TEAM_BORDERS.length]}`,
                    color: TEAM_INITIAL_COLORS[i % TEAM_INITIAL_COLORS.length],
                  }}
                >
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white/90">{m.name}</p>
                  <p className="truncate text-[11px] text-white/50">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Your next 30 days
          </p>
          <ol className="space-y-2.5">
            {ROADMAP.map((step, i) => {
              const Icon = step.icon;
              const isFirst = i === 0;
              return (
                <li
                  key={step.label}
                  className="flex items-start gap-3.5 rounded-xl px-4 py-3"
                  style={{
                    background: isFirst ? 'rgba(12,191,106,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isFirst ? 'rgba(12,191,106,0.28)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: isFirst ? 'rgba(12,191,106,0.18)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: isFirst ? '#0CBF6A' : 'rgba(255,255,255,0.55)' }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: isFirst ? '#0CBF6A' : 'rgba(255,255,255,0.4)' }}
                      >
                        {step.when}
                      </span>
                      <span className="text-[14px] font-medium text-white/90">{step.label}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[11px] text-white/35">
            We underpromise on timelines — the realistic version, not the best-case version.
          </p>
        </section>

        {/* CTA */}
        <div className="sticky bottom-0 -mx-6 mt-2 border-t border-white/5 bg-[#060B08]/95 px-6 py-5 backdrop-blur md:-mx-10 md:px-10">
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12.5px] text-white/55">
              Tip: install <a href="https://wisprflow.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-[#0CBF6A] underline">Wispr Flow</a> to speak your answers — richer detail, way faster.
            </p>
            <Button size="lg" onClick={onBegin} className="gap-2">
              Begin discovery
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
