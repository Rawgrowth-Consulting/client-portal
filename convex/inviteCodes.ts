import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { nanoid } from "nanoid";

// Generate a new invite code (admin only)
export const create = mutation({
  args: {
    createdBy: v.string(),
    note: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate a short memorable code: e.g. RG-A3X9K2
    const code = "RG-" + Math.random().toString(36).toUpperCase().slice(2, 8);
    await ctx.db.insert("inviteCodes", {
      code,
      createdBy: args.createdBy,
      note: args.note,
      expiresAt: args.expiresAt,
    });
    return code;
  },
});

// Validate an invite code (returns the record if valid)
export const validate = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase().trim()))
      .first();

    if (!record) return { valid: false, reason: "Invalid invite code." };
    if (record.usedBy) return { valid: false, reason: "This invite code has already been used." };
    if (record.expiresAt && record.expiresAt < Date.now()) {
      return { valid: false, reason: "This invite code has expired." };
    }
    return { valid: true, code: record.code, note: record.note };
  },
});

// Mark code as used
export const markUsed = mutation({
  args: { code: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!record) throw new Error("Code not found");
    await ctx.db.patch(record._id, {
      usedBy: args.email,
      usedAt: Date.now(),
    });
  },
});

// List all invite codes (admin)
export const listAll = query({
  handler: async (ctx) => {
    return ctx.db.query("inviteCodes").collect();
  },
});

// Delete an invite code
export const remove = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (record) await ctx.db.delete(record._id);
  },
});

// Reset a used invite code so it can be used again
export const reset = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase().trim()))
      .first();
    if (!record) throw new Error("Code not found");
    await ctx.db.patch(record._id, {
      usedBy: undefined,
      usedAt: undefined,
    });
    return { reset: true, code: record.code };
  },
});
