// The 10 profile-document types — frozen contract (matches the
// client_profile_documents.type CHECK constraint from F-001 migration 0004).
// Changing this set requires an ADR + ALTER TYPE.
export const DOC_TYPES = [
  "brand_doc",
  "offer_doc",
  "icp_doc",
  "voice_guide",
  "content_strategy",
  "funnel_strategy",
  "sales_strategy",
  "agent_context",
  "tool_checklist",
  "approval_rules",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TITLES: Record<DocType, string> = {
  brand_doc: "Brand Document",
  offer_doc: "Offer & Pricing",
  icp_doc: "Ideal Customer Profile",
  voice_guide: "Brand Voice Guide",
  content_strategy: "Content Strategy",
  funnel_strategy: "Funnel Strategy",
  sales_strategy: "Sales Strategy",
  agent_context: "Agent Context Brief",
  tool_checklist: "Tool Checklist",
  approval_rules: "Approval Rules",
};

// Normalized intake snapshot a generator reads from. Built from
// onboarding_submissions.answers_json (preferred) or the brand_intakes jsonb
// columns. Keys are sparse — generators must tolerate missing fields.
export type Submission = Record<string, any>;

export type GeneratorOk = { ok: true; type: DocType; title: string; content_markdown: string };
export type GeneratorErr = { ok: false; type: DocType; error: string };
export type GeneratorResult = GeneratorOk | GeneratorErr;

export type DocGenerator = (submission: Submission) => Promise<GeneratorResult>;
