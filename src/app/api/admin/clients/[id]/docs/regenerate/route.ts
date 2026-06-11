import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DOC_TYPES, DOC_TITLES, type DocType } from "@/lib/docs/types";
import { GENERATORS, buildSubmission } from "@/lib/docs/generate-all";
import { runDocLLM } from "@/lib/docs/llm";

// LLM gen + revision pass — allow generous headroom.
export const maxDuration = 300;

const REVISE_SYSTEM = `You are revising a generated business document. Apply the admin's feedback while keeping the document's structure and Markdown formatting. Output only the revised document in clean GitHub-flavored Markdown — no preamble, no code fences.`;

// FC-05: admin regenerates one doc type with feedback. Writes a new version with
// approved_at cleared. Feedback is spliced via a revision pass over a fresh gen.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAuthUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: actorClient } = await supabaseAdmin
    .from("clients")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle();
  if (actorClient?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: clientId } = await params;
  const body = await _req.json().catch(() => ({}));
  const type = body?.type as DocType;
  let feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
  if (!DOC_TYPES.includes(type)) {
    return NextResponse.json({ error: "unknown doc type" }, { status: 400 });
  }
  if (feedback.length > 5000) feedback = feedback.slice(0, 5000); // PID edge: trim long feedback

  const { submission, submissionId } = await buildSubmission(clientId);
  const result = await GENERATORS[type](submission);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  let content = result.content_markdown;
  if (feedback) {
    try {
      content = await runDocLLM(
        REVISE_SYSTEM,
        `Original document:\n\n${content}\n\n---\n\nApply this admin feedback and return the full revised document:\n${feedback}`
      );
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "revision failed" }, { status: 502 });
    }
  }

  const { data: latest } = await supabaseAdmin
    .from("client_profile_documents")
    .select("version")
    .eq("client_id", clientId)
    .eq("type", type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  const { data: row, error } = await supabaseAdmin
    .from("client_profile_documents")
    .insert({
      client_id: clientId,
      type,
      title: result.title || DOC_TITLES[type],
      content_markdown: content,
      source_submission_id: submissionId,
      version,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, doc: row });
}
