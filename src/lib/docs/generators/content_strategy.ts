import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are a content strategist. Write a Content Strategy: pillars, channels, cadence, and themes mapped to the audience and goals. Ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "content_strategy" as const;
  const title = "Content Strategy";
  try {
    const user = assemble(
      [
        block(submission, "brand_voice", "Brand voice & messaging pillars"),
        block(submission, "target_audience", "Audience"),
        block(submission, "social_presence", "People & channels"),
        block(submission, "goals", "Goals"),
      ],
      "Write the Content Strategy: define 3-5 content pillars, the channels to publish on, a realistic cadence, and example themes per pillar that speak to the audience and advance the goals."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
