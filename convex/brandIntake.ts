import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get brand intake for a client
export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("brandIntakes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
  },
});

// Save a section of the brand intake
export const saveSection = mutation({
  args: {
    clientId: v.id("clients"),
    section: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db
      .query("brandIntakes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!intake) throw new Error("Brand intake not found");

    await ctx.db.patch(intake._id, {
      [args.section]: args.data,
    });
  },
});

// Submit the full brand intake (marks as done, triggers profile generation)
export const submit = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const intake = await ctx.db
      .query("brandIntakes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!intake) throw new Error("Brand intake not found");

    await ctx.db.patch(intake._id, {
      submittedAt: Date.now(),
    });

    // Create a brand profile in "generating" state
    await ctx.db.insert("brandProfiles", {
      clientId: args.clientId,
      version: 1,
      content: "",
      status: "generating",
      generatedAt: Date.now(),
    });

    return intake._id;
  },
});
