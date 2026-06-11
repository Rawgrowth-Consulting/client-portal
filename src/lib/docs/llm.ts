import OpenAI from "openai";

// Shared LLM client for profile-document generators. Mirrors the onboarding
// chat route: prod uses OpenRouter (OPENROUTER_API_KEY), local/dev may use
// OPENAI_API_KEY. Override the model with PROFILE_DOCS_MODEL.
const USE_OPENROUTER = !process.env.OPENAI_API_KEY && !!process.env.OPENROUTER_API_KEY;

export const DOCS_MODEL =
  process.env.PROFILE_DOCS_MODEL ||
  (USE_OPENROUTER ? "anthropic/claude-opus-4.7" : "gpt-4o");

export const LLM_KEY_PRESENT = !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "missing-key",
      ...(USE_OPENROUTER ? { baseURL: "https://openrouter.ai/api/v1" } : {}),
    });
  }
  return _client;
}

// Runs one generation call and returns the markdown body. Throws on LLM error
// so the orchestrator can record a per-doc failure and leave the type for retry.
export async function runDocLLM(system: string, user: string): Promise<string> {
  const resp = await client().chat.completions.create({
    model: DOCS_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
  });
  const content = resp.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("empty LLM response");
  return content;
}
