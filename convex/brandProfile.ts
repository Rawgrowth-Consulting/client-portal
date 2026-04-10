import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Get the latest brand profile for a client
export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (profiles.length === 0) return null;

    // Return the highest version
    return profiles.sort((a, b) => b.version - a.version)[0];
  },
});

// Update brand profile content (called by generation action)
export const updateContent = mutation({
  args: {
    profileId: v.id("brandProfiles"),
    content: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("approved")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      content: args.content,
      status: args.status,
    });
  },
});

// Approve a brand profile
export const approve = mutation({
  args: {
    profileId: v.id("brandProfiles"),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      status: "approved",
      approvedAt: Date.now(),
      approvedBy: args.approvedBy,
    });
  },
});

// Request regeneration with feedback
export const regenerate = mutation({
  args: {
    clientId: v.id("clients"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const latestVersion = profiles.length > 0
      ? Math.max(...profiles.map((p) => p.version))
      : 0;

    // Create new version in generating state
    const profileId = await ctx.db.insert("brandProfiles", {
      clientId: args.clientId,
      version: latestVersion + 1,
      content: "",
      status: "generating",
      generatedAt: Date.now(),
    });

    return profileId;
  },
});

// Generate brand profile using Claude API (action -- runs outside transaction)
export const generate = action({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    // Get the brand intake data
    const intake = await ctx.runQuery(api.brandIntake.get, {
      clientId: args.clientId,
    });

    if (!intake) throw new Error("No brand intake found");

    // Get or create the profile
    let profile = await ctx.runQuery(api.brandProfile.get, {
      clientId: args.clientId,
    });

    if (!profile) {
      throw new Error("No brand profile record found");
    }

    // Delegate AI generation to the Next.js API route which has access to env vars
    const generateUrl = "https://portal.rawgrowth.ai/api/brand-profile/ai-generate";
    const genResponse = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: args.clientId, profileId: profile._id }),
    });

    if (!genResponse.ok) {
      // Silently mark ready with empty content — team will fill it manually
      await ctx.runMutation(api.brandProfile.updateContent, {
        profileId: profile._id,
        content: "",
        status: "ready",
      });
      return;
    }

    // Generation was handled by the Next.js route — profile already updated
    return;
  },
});
