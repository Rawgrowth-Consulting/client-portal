import type { DocGenerator } from "../types";
import { runDocLLM } from "../llm";
import { block, assemble } from "../prompt-utils";

const SYSTEM = `You are an offer strategist. Write an Offer & Pricing document: each core offer, its price/model, revenue streams, and the value ladder. Ground everything in the intake; do not invent prices.
Output only the document in clean GitHub-flavored Markdown. Start with an H1 title. No preamble, no closing remarks, no surrounding code fences.`;

export const generate: DocGenerator = async (submission) => {
  const type = "offer_doc" as const;
  const title = "Offer & Pricing";
  try {
    const user = assemble(
      [
        block(submission, "basic_info", "Company snapshot (offers, pricing, scale)"),
        block(submission, "business_model", "Functions & business model"),
        block(submission, "goals", "Goals"),
      ],
      "Write the Offer & Pricing document: list each core offer with pricing/model, map the revenue streams, and lay out the value ladder from entry to premium."
    );
    const content_markdown = await runDocLLM(SYSTEM, user);
    return { ok: true, type, title, content_markdown };
  } catch (e: any) {
    return { ok: false, type, error: e?.message || "generation failed" };
  }
};
