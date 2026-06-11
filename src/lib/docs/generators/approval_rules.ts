import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are an AI-governance analyst. Write Approval Rules: the autonomy default, hard no-gos, data that must never leave, escalation triggers, approval boundaries, and what agents must never touch. Ground everything in the intake; be precise and unambiguous.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "approval_rules" as const;
  const title = "Approval Rules";
  try {
    const user = assemble(
      [
        block(submission, "challenges", "Guardrails"),
        block(submission, "business_model", "Functions"),
        block(submission, "target_audience", "Regulated/sensitive context"),
      ],
      "Write the Approval Rules: state the autonomy default (draft-for-approval vs autonomous), the hard no-gos, data that must never leave the company, when an agent must stop and ask a human, explicit approval boundaries (dollar amounts, customer-facing sends), and systems/accounts/decisions agents must never touch."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
