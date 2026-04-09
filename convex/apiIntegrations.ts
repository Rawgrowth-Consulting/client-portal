import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit an API key for a platform
export const submit = mutation({
  args: {
    clientId: v.id("clients"),
    platform: v.string(),
    keyName: v.string(),
    keyValue: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only store last 4 chars as hint
    const keyHint = args.keyValue.slice(-4);

    // Check if already exists for this platform
    const existing = await ctx.db
      .query("apiIntegrations")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const existingForPlatform = existing.find(
      (i) => i.platform === args.platform
    );

    if (existingForPlatform) {
      await ctx.db.patch(existingForPlatform._id, {
        keyName: args.keyName,
        keyHint,
        notes: args.notes,
      });
      return existingForPlatform._id;
    }

    return await ctx.db.insert("apiIntegrations", {
      clientId: args.clientId,
      platform: args.platform,
      keyName: args.keyName,
      keyHint,
      notes: args.notes,
    });
  },
});

// Get all API integrations for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("apiIntegrations")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});
