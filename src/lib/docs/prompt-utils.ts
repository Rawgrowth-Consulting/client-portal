import type { Submission } from "./types";

// Formats one intake field as a labelled block, tolerating missing/nested values.
// Returns "" when the field is absent so empty sections drop out of the prompt.
export function block(submission: Submission, key: string, label: string): string {
  const v = submission?.[key];
  if (v === undefined || v === null || v === "") return "";
  const body = typeof v === "string" ? v : JSON.stringify(v, null, 2);
  return `## ${label}\n${body}\n`;
}

// Pulls function-deep-dive rows (content_messaging jsonb array) for one function.
export function deepDiveRows(submission: Submission, functionId: string): any[] {
  const rows = submission?.content_messaging;
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r?.function_id === functionId);
}

// Assembles the final user prompt from labelled blocks + a task instruction.
export function assemble(blocks: string[], task: string): string {
  const context = blocks.filter(Boolean).join("\n").trim() || "(no intake data captured)";
  return `Here is the client's onboarding intake:\n\n${context}\n\n---\n\n${task}`;
}
