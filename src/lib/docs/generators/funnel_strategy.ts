import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are a growth/funnel strategist. Write a Funnel Strategy: awareness to consideration to conversion, lead magnets, nurture, and how buying triggers map to each stage. Ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "funnel_strategy" as const;
  const title = "Funnel Strategy";
  try {
    const user = assemble(
      [
        block(submission, "target_audience", "Market, triggers & objections"),
        block(submission, "business_model", "Business model"),
        block(submission, "basic_info", "Offers"),
        block(submission, "goals", "Goals"),
      ],
      "Write the Funnel Strategy: map the awareness -> consideration -> conversion stages, propose lead magnets and a nurture sequence, and show how the customer's buying triggers and alternatives inform each stage."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
