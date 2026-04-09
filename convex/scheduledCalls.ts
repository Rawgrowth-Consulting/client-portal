import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Schedule a call
export const schedule = mutation({
  args: {
    clientId: v.id("clients"),
    title: v.string(),
    month: v.number(),
    week: v.number(),
    calendlyUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if this call slot already exists
    const existing = await ctx.db
      .query("scheduledCalls")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const existingCall = existing.find(
      (c) => c.month === args.month && c.week === args.week
    );

    if (existingCall) {
      await ctx.db.patch(existingCall._id, {
        calendlyUrl: args.calendlyUrl,
        scheduledAt: args.scheduledAt,
      });
      return existingCall._id;
    }

    return await ctx.db.insert("scheduledCalls", {
      clientId: args.clientId,
      title: args.title,
      month: args.month,
      week: args.week,
      calendlyUrl: args.calendlyUrl,
      scheduledAt: args.scheduledAt,
      completed: false,
    });
  },
});

// Get all calls for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("scheduledCalls")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});
