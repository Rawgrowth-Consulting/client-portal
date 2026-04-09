"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { number: 1, name: "Welcome", path: "1-welcome" },
  { number: 2, name: "Questionnaire", path: "2-questionnaire" },
  { number: 3, name: "Brand Profile", path: "3-brand-profile" },
  { number: 4, name: "Brand Documents", path: "4-brand-docs" },
  { number: 5, name: "API Keys", path: "5-api-keys" },
  { number: 6, name: "Software Access", path: "6-software-access" },
  { number: 7, name: "Schedule Calls", path: "7-schedule-calls" },
  { number: 8, name: "Complete", path: "8-complete" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("rg_client_id");
    if (!id) {
      router.push("/");
      return;
    }
    setClientId(id);
  }, [router]);

  const client = useQuery(
    api.clients.get,
    clientId ? { clientId: clientId as Id<"clients"> } : "skip"
  );

  if (!clientId) return null;

  const currentStep = client?.onboardingStep || 1;
  const clientName = client?.name || "";

  // Figure out which step we're on from the URL
  const activeStepFromUrl =
    STEPS.find((s) => pathname?.includes(s.path))?.number || currentStep;

  return (
    <div className="flex min-h-screen bg-[#060B08]">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[#0A1210] p-6 md:block">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
            Rawgrowth
          </p>
          <p className="mt-1 text-sm text-[rgba(255,255,255,0.5)]">
            Client Onboarding
          </p>
        </div>

        <nav className="space-y-1">
          {STEPS.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === activeStepFromUrl;
            const isFuture = step.number > currentStep;

            return (
              <Link
                key={step.number}
                href={
                  step.number <= currentStep
                    ? `/onboarding/${step.path}`
                    : "#"
                }
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isCurrent ? "bg-[rgba(12,191,106,0.08)] text-white" : ""
                } ${isFuture ? "pointer-events-none" : "hover:bg-[rgba(255,255,255,0.03)]"}`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isCompleted
                      ? "bg-[#0CBF6A] text-white"
                      : isCurrent
                        ? "border-2 border-[#0CBF6A] text-[#0CBF6A]"
                        : "border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.3)]"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17L4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={
                    isFuture ? "text-[rgba(255,255,255,0.3)]" : ""
                  }
                >
                  {step.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {clientName && (
          <div className="mt-auto pt-8">
            <p className="text-xs text-[rgba(255,255,255,0.3)]">
              Logged in as
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.6)]">
              {clientName}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#060B08]/95 px-4 py-3 backdrop-blur md:hidden">
        <p className="text-xs font-medium uppercase tracking-widest text-[#0CBF6A]">
          Rawgrowth
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.5)]">
          Step {activeStepFromUrl} of 8
        </p>
      </div>

      {/* Main content */}
      <main className="mt-14 flex-1 overflow-y-auto px-6 py-8 md:mt-0 md:px-12 md:py-12">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
