import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Confirm access to a platform
export const confirm = mutation({
  args: {
    clientId: v.id("clients"),
    platform: v.string(),
    accessType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("softwareAccess")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const existingForPlatform = existing.find(
      (s) => s.platform === args.platform
    );

    if (existingForPlatform) {
      await ctx.db.patch(existingForPlatform._id, {
        confirmed: true,
        notes: args.notes,
      });
      return existingForPlatform._id;
    }

    return await ctx.db.insert("softwareAccess", {
      clientId: args.clientId,
      platform: args.platform,
      accessType: args.accessType,
      confirmed: true,
      notes: args.notes,
    });
  },
});

// Get all software access records for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("softwareAccess")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});
