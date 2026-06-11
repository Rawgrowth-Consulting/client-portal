import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are a customer-research strategist. Write an Ideal Customer Profile: segments, best/worst-fit customers, pains, dream outcomes, objections, and buying triggers. Ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "icp_doc" as const;
  const title = "Ideal Customer Profile";
  try {
    const user = assemble(
      [
        block(submission, "target_audience", "Market & customers"),
        block(submission, "basic_info", "Company snapshot"),
        block(submission, "goals", "Goals"),
      ],
      "Write the Ideal Customer Profile: define the primary segment(s), best-fit vs worst-fit customers, their top pains and dream outcome, the main objections, buying triggers, and what they use today instead."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
