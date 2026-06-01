import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Dashboard Impact (ROI) endpoint — the data contract Hermes Workspace /
 * the agent job pipeline pushes into for the portal to render.
 *
 * Until that feed exists, this returns `dataReady: false` with safe zeros so
 * the UI renders an honest empty state. Once Pedro wires the Hermes feed, this
 * route reads from wherever impact lives (e.g. an `agent_impact` table or a
 * Hermes webhook endpoint) and flips `dataReady` to true.
 *
 * Shape is FROZEN below — that's the contract.
 */
export const dynamic = "force-dynamic";

export type ImpactPayload = {
  /** True once real agent-job impact data is flowing in for this client. */
  dataReady: boolean;
  /** When the data was last refreshed (ISO). null while !dataReady. */
  asOf: string | null;
  /** Headline rollups for the current month. */
  monthly: {
    hoursSaved: number;
    outputsShipped: number;
    dollarsInfluenced: number;
    agentsLive: number;
  };
  /** Daily trend over the last 30 days (hours saved). Empty until !dataReady=false. */
  trend: Array<{ date: string; hoursSaved: number }>;
  /** Per-agent breakdown. */
  perAgent: Array<{
    name: string;
    function: string;
    status: "queued" | "building" | "live";
    hoursSavedMonth: number;
    outputsShippedMonth: number;
  }>;
  /** Human-readable note for the UI when dataReady is false. */
  note?: string;
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Future-ready: read from an `agent_impact` table if it exists. We don't
  // create it from here (no DDL access), but the lookup is harmless if absent.
  // For now, always return the empty state with the same shape.
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("status, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const payload: ImpactPayload = {
    dataReady: false,
    asOf: null,
    monthly: {
      hoursSaved: 0,
      outputsShipped: 0,
      dollarsInfluenced: 0,
      agentsLive: 0,
    },
    trend: [],
    perAgent: [],
    note:
      client?.status === "active"
        ? "Your AI department is being installed. Impact data starts flowing here the moment your first agent ships work (typically Weeks 2–3)."
        : "Finish onboarding to set up your AI department. Impact data appears here once the first agent goes live.",
  };

  return NextResponse.json(payload);
}
