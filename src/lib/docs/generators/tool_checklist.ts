import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are an integrations analyst. Write a Tool Checklist: every tool/system to connect, what data lives in each, read/write intent, and connect priority. Ground everything in the intake; do not invent tools.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. Prefer a table. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "tool_checklist" as const;
  const title = "Tool Checklist";
  try {
    const user = assemble(
      [
        block(submission, "tools_systems", "Tool stack"),
        block(submission, "competitors", "Access & connections inventory"),
        block(submission, "business_model", "Functions"),
      ],
      "Write the Tool Checklist: a table of every tool/system to connect, with columns for tool, category, data held, read/write intent, and connect priority (must-have v1 vs later). Group by priority."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
