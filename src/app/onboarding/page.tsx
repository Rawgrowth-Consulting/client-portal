import Image from "next/image";

import { getAuthUser } from "@/lib/auth";
import { computeOnboardingProgress } from "@/lib/onboarding";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OnboardingWorkspace from "./OnboardingWorkspace";

export default async function OnboardingPage() {
  const user = await getAuthUser();
  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const initialProgress = user
    ? await computeOnboardingProgress(user.id)
    : { current: 0, total: 14, completed: [] };
  const { data: clientRow } = user
    ? await supabaseAdmin.from("clients").select("company").eq("id", user.id).maybeSingle()
    : { data: null };
  const company = (clientRow?.company as string | null) ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="rg-fade-in shrink-0 border-b border-[rgba(255,255,255,0.06)] bg-[#0A1210]/60">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4 md:px-8">
          <Image
            src="/rawgrowth.png"
            alt="Rawgrowth"
            width={28}
            height={28}
            priority
            className="h-7 w-7 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#0CBF6A]">
              Onboarding
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.85)]">
              Let's get to know your business
            </p>
          </div>
        </div>
      </header>

      {/* Chat + live operating map */}
      <div className="min-h-0 flex-1">
        <OnboardingWorkspace firstName={firstName} company={company} initialProgress={initialProgress} />
      </div>
    </div>
  );
}
