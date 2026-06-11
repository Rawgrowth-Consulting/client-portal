import { supabaseAdmin } from "@/lib/supabase-admin";
import { DOC_TYPES, type DocType } from "@/lib/docs/types";

export const PACKET_VERSION = "v1";

export type PacketResult =
  | { ok: true; packet: Record<string, any> }
  | { ok: false; status: number; body: Record<string, any> };

// Assembles the deployment packet (ADR-006 shape). Read-only on all tables.
// FC-03: returns 409 if any of the 10 profile documents is unapproved.
export async function buildPacket(clientId: string): Promise<PacketResult> {
  const warnings: string[] = [];

  // Select * so the query works whether or not the optional deployment_status
  // column has been added to clients yet.
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return { ok: false, status: 404, body: { error: "client not found" } };

  // Latest approved version per doc type.
  const { data: docRows } = await supabaseAdmin
    .from("client_profile_documents")
    .select("type, content_markdown, approved_at, version")
    .eq("client_id", clientId)
    .order("version", { ascending: false });

  const latestApproved = new Map<DocType, { content_markdown: string; approved_at: string }>();
  const seen = new Set<string>();
  for (const r of docRows ?? []) {
    if (seen.has(r.type)) continue; // first = latest version
    seen.add(r.type);
    if (r.approved_at) latestApproved.set(r.type as DocType, r);
  }
  const missingTypes = DOC_TYPES.filter((t) => !latestApproved.has(t));
  if (missingTypes.length > 0) {
    return { ok: false, status: 409, body: { error: "docs_not_approved", missing_types: missingTypes } };
  }

  const { data: users } = await supabaseAdmin
    .from("client_users")
    .select("*")
    .eq("client_id", clientId);

  const { data: intakeRow } = await supabaseAdmin
    .from("onboarding_submissions")
    .select("answers_json")
    .eq("client_id", clientId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: intakeRaw } = await supabaseAdmin
    .from("brand_intakes")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  const intake = { ...(intakeRaw ?? {}), ...((intakeRow?.answers_json as object) ?? {}) };

  // Training assignments (F-005). Table may not exist yet — tolerate.
  let trainingAssignments: any[] = [];
  const ta = await supabaseAdmin
    .from("client_training_assignments")
    .select("*, training_materials(*)")
    .eq("client_id", clientId);
  if (ta.error) warnings.push("training assignments unavailable (F-005 not shipped)");
  else trainingAssignments = ta.data ?? [];

  const { data: access } = await supabaseAdmin
    .from("software_access")
    .select("*")
    .eq("client_id", clientId);

  // Files via client_files (documents). storage_url is already a usable URL.
  const { data: files } = await supabaseAdmin
    .from("client_files")
    .select("*")
    .eq("client_id", clientId);
  const filesByPurpose: Record<string, any[]> = {};
  for (const f of files ?? []) {
    const purpose = f.purpose || "client_reference";
    (filesByPurpose[purpose] ||= []).push({ filename: f.filename, url: f.storage_url, type: f.type });
  }
  const brandAssets = filesByPurpose["brand_asset"] ?? [];
  if (brandAssets.length === 0) warnings.push("no brand assets uploaded");

  const profile_documents = DOC_TYPES.map((t) => ({
    type: t,
    content_markdown: latestApproved.get(t)!.content_markdown,
    approved_at: latestApproved.get(t)!.approved_at,
  }));

  const packet = {
    client,
    users: users ?? [],
    intake,
    profile_documents,
    training_assignments: trainingAssignments,
    tool_checklist: { stack: (intake as any).tools_systems ?? [], software_access: access ?? [] },
    approval_rules: (intake as any).challenges ?? {},
    branding: { voice: (intake as any).brand_voice ?? {}, files: brandAssets },
    files: filesByPurpose,
    packet_version: PACKET_VERSION,
    warnings,
  };

  return { ok: true, packet };
}
