import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log an activity event
export const log = mutation({
  args: {
    clientId: v.id("clients"),
    eventType: v.string(),
    title: v.string(),
    description: v.string(),
    agentName: v.optional(v.string()),
    metadata: v.optional(v.any()),
    severity: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityFeed", args);
  },
});

// Get recent activity for a client
export const list = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("activityFeed")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(args.limit ?? 20);

    return events;
  },
});

// Mark event as read
export const markRead = mutation({
  args: { eventId: v.id("activityFeed") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { readAt: Date.now() });
  },
});

// Get unread count
export const unreadCount = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("activityFeed")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .collect();

    return unread.length;
  },
});
