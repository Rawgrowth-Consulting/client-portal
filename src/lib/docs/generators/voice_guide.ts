import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are a brand-voice editor. Write a Brand Voice Guide: tone, words/phrases to never use, signature phrases, messaging pillars, and good vs bad copy examples. Ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "voice_guide" as const;
  const title = "Brand Voice Guide";
  try {
    const user = assemble(
      [
        block(submission, "brand_voice", "Brand & voice"),
        block(submission, "basic_info", "Company snapshot"),
        block(submission, "target_audience", "Audience"),
      ],
      "Write the Brand Voice Guide: describe the tone, list words/phrases to never use, signature phrases, core messaging pillars, and contrast a good-copy example with a bad-copy example so anything the agents produce sounds on-brand."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
