import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are a brand strategist. Write a concise Brand Document capturing the company's identity, mission, positioning, and what makes it different. Ground every claim in the intake; do not invent facts.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "brand_doc" as const;
  const title = "Brand Document";
  try {
    const user = assemble(
      [
        block(submission, "basic_info", "Company snapshot"),
        block(submission, "business_model", "Functions & business model"),
        block(submission, "brand_voice", "Brand voice"),
        block(submission, "target_audience", "Market & positioning"),
        block(submission, "goals", "Goals"),
      ],
      "Write the Brand Document: identity, mission/purpose, positioning/category, and the 3-5 things that make this company different."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
