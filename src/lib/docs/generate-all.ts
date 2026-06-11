import { supabaseAdmin } from "@/lib/supabase-admin";
import { DOC_TYPES, DOC_TITLES, type DocType, type Submission, type GeneratorResult } from "./types";
import { generate as brand_doc } from "./generators/brand_doc";
import { generate as offer_doc } from "./generators/offer_doc";
import { generate as icp_doc } from "./generators/icp_doc";
import { generate as voice_guide } from "./generators/voice_guide";
import { generate as content_strategy } from "./generators/content_strategy";
import { generate as funnel_strategy } from "./generators/funnel_strategy";
import { generate as sales_strategy } from "./generators/sales_strategy";
import { generate as agent_context } from "./generators/agent_context";
import { generate as tool_checklist } from "./generators/tool_checklist";
import { generate as approval_rules } from "./generators/approval_rules";

export const GENERATORS: Record<DocType, (s: Submission) => Promise<GeneratorResult>> = {
  brand_doc,
  offer_doc,
  icp_doc,
  voice_guide,
  content_strategy,
  funnel_strategy,
  sales_strategy,
  agent_context,
  tool_checklist,
  approval_rules,
};

// Merge the latest onboarding snapshot with the raw brand_intakes jsonb so a
// generator sees a single flat object regardless of which path populated data.
export async function buildSubmission(
  clientId: string
): Promise<{ submission: Submission; submissionId: string | null }> {
  const { data: snap } = await supabaseAdmin
    .from("onboarding_submissions")
    .select("id, answers_json")
    .eq("client_id", clientId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: intake } = await supabaseAdmin
    .from("brand_intakes")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  const submission: Submission = { ...intake, ...(snap?.answers_json as object) };
  return { submission, submissionId: snap?.id ?? null };
}

// Runs all 10 generators concurrently. Failures are returned, not thrown, so a
// partial set still persists (FC-02 / FC-08).
export async function generateAllProfileDocuments(submission: Submission): Promise<GeneratorResult[]> {
  return Promise.all(DOC_TYPES.map((t) => GENERATORS[t](submission)));
}

async function nextVersion(clientId: string, type: DocType): Promise<number> {
  const { data } = await supabaseAdmin
    .from("client_profile_documents")
    .select("version")
    .eq("client_id", clientId)
    .eq("type", type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.version ?? 0) + 1;
}

// Persists one row per successful generator. Each gets version = latest+1 for
// that (client, type), leaving prior versions intact (FC-09 sequential versions).
export async function persistResults(
  clientId: string,
  submissionId: string | null,
  results: GeneratorResult[]
): Promise<{ inserted: DocType[]; failed: { type: DocType; error: string }[] }> {
  const inserted: DocType[] = [];
  const failed: { type: DocType; error: string }[] = [];

  for (const r of results) {
    if (!r.ok) {
      failed.push({ type: r.type, error: r.error });
      continue;
    }
    const version = await nextVersion(clientId, r.type);
    const { error } = await supabaseAdmin.from("client_profile_documents").insert({
      client_id: clientId,
      type: r.type,
      title: r.title || DOC_TITLES[r.type],
      content_markdown: r.content_markdown,
      source_submission_id: submissionId,
      version,
    });
    if (error) failed.push({ type: r.type, error: error.message });
    else inserted.push(r.type);
  }

  return { inserted, failed };
}

// Entry point for the onboarding completion path.
export async function runProfileDocsForClient(clientId: string) {
  const { submission, submissionId } = await buildSubmission(clientId);
  const results = await generateAllProfileDocuments(submission);
  return persistResults(clientId, submissionId, results);
}
