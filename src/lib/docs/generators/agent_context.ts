import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are writing the master context brief an AI department reads first before doing any work for this client. Synthesize who the business is, what it sells, who it serves, how it sounds, and what the agents are expected to do. Be dense and factual; ground everything in the intake.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "agent_context" as const;
  const title = "Agent Context Brief";
  try {
    const user = assemble(
      [
        block(submission, "basic_info", "Company snapshot"),
        block(submission, "business_model", "Functions & business model"),
        block(submission, "target_audience", "Market & customers"),
        block(submission, "brand_voice", "Brand voice"),
        block(submission, "goals", "Goals & bottlenecks"),
        block(submission, "challenges", "Guardrails"),
        block(submission, "tools_systems", "Tool stack"),
        block(submission, "content_messaging", "Function deep-dives"),
      ],
      "Write the Agent Context Brief: a single dense reference the AI department reads first. Cover company overview, offers, ICP, voice, priorities/goals, the functions to support, and the guardrails. Keep it scannable with clear sections."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
