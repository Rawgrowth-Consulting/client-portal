import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble, deepDiveRows } from "../prompt-utils";

const SYSTEM = `You are a sales strategist. Write a Sales Strategy: the sales process, scripts/talk tracks, proposal process, follow-up cadence, and objection handling. Ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "sales_strategy" as const;
  const title = "Sales Strategy";
  try {
    const salesRows = deepDiveRows(submission, "sales");
    const salesBlock = salesRows.length
      ? `## Sales deep-dive\n${JSON.stringify(salesRows, null, 2)}\n`
      : "";
    const user = assemble(
      [
        salesBlock,
        block(submission, "target_audience", "Audience & objections"),
        block(submission, "basic_info", "Offers"),
      ],
      "Write the Sales Strategy: lay out the end-to-end sales process, incorporate the client's scripts/talk tracks, proposal process and follow-up cadence, and add an objection-handling playbook for the main objections."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
