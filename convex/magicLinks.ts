import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Clean up old unused tokens for this email
    const old = await ctx.db
      .query("magicLinks")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const link of old) {
      await ctx.db.delete(link._id);
    }
    return await ctx.db.insert("magicLinks", { ...args, used: false });
  },
});

export const verify = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("magicLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const markUsed = mutation({
  args: { id: v.id("magicLinks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { used: true });
  },
});
