import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert an onboarding step (mark as completed)
export const upsert = mutation({
  args: {
    clientId: v.id("clients"),
    stepNumber: v.number(),
    stepName: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onboardingSteps")
      .withIndex("by_clientId_step", (q) =>
        q.eq("clientId", args.clientId).eq("stepNumber", args.stepNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: Date.now(),
        data: args.data,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("onboardingSteps", {
        clientId: args.clientId,
        stepNumber: args.stepNumber,
        stepName: args.stepName,
        completed: true,
        completedAt: Date.now(),
        data: args.data,
      });
    }
  },
});

// Get steps for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("onboardingSteps")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});
