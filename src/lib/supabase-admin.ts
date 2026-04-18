import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client with service-role key.
// Bypasses Row-Level Security — never import from client components.
//
// We initialise lazily (on first use) via a Proxy so that simply *importing*
// this module never crashes. That way a missing env var surfaces at the exact
// call site that needed it, with a clearer message, and the dev server doesn't
// get wedged if `.env` was edited without a restart.

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length) {
    throw new Error(
      `Supabase admin client: missing env var(s): ${missing.join(", ")}. ` +
        `Check .env and fully restart \`next dev\` — Next.js only reads env at boot.`
    );
  }

  cached = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Proxy preserves the existing `supabaseAdmin.from(...)` API shape without
// evaluating env until the first real call.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const real = getClient();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
