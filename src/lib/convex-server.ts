import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adjoining-scorpion-918.convex.cloud";

// Server-side Convex client for Next.js API routes
// This is the HTTP client (works in Node.js, not just browser)
export function createConvexClient() {
  return new ConvexHttpClient(CONVEX_URL);
}

// Shared client instance for simple server-side usage
export const convex = new ConvexHttpClient(CONVEX_URL);
