import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save document metadata after upload
export const save = mutation({
  args: {
    clientId: v.id("clients"),
    type: v.union(
      v.literal("logo"),
      v.literal("guideline"),
      v.literal("asset"),
      v.literal("other")
    ),
    storageId: v.id("_storage"),
    filename: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", args);
  },
});

// Get all documents for a client
export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Add download URLs
    return Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        url: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});

// Delete a document
export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (doc) {
      await ctx.storage.delete(doc.storageId);
      await ctx.db.delete(args.documentId);
    }
  },
});
