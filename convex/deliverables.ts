import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List deliverables for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("deliverables")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

// Create a deliverable
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    month: v.number(),
    week: v.number(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deliverables", {
      ...args,
      completed: false,
    });
  },
});

// Toggle completed state
export const toggle = mutation({
  args: {
    deliverableId: v.id("deliverables"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deliverableId, {
      completed: args.completed,
      completedAt: args.completed ? Date.now() : undefined,
    });
  },
});
