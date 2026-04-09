import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a resource
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("skill"),
      v.literal("update"),
      v.literal("doc"),
      v.literal("tool")
    ),
    storageId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    pushedBy: v.string(),
    targetAll: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resources", args);
  },
});

// Get resources assigned to a client
export const listForClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("resourceAssignments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const resources = await Promise.all(
      assignments.map(async (a) => {
        const resource = await ctx.db.get(a.resourceId);
        return resource ? { ...resource, assignment: a } : null;
      })
    );

    // Also get global resources
    const allResources = await ctx.db.query("resources").collect();
    const globalResources = allResources.filter((r) => r.targetAll);

    // Merge, deduplicate
    const seen = new Set(resources.filter(Boolean).map((r) => r!._id));
    const combined = [...resources.filter(Boolean)];
    for (const gr of globalResources) {
      if (!seen.has(gr._id)) {
        combined.push({ ...gr, assignment: null as any });
      }
    }

    return combined;
  },
});

// Mark a resource assignment as seen
export const markSeen = mutation({
  args: { assignmentId: v.id("resourceAssignments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assignmentId, { seenAt: Date.now() });
  },
});

// Assign resource to a client
export const assign = mutation({
  args: {
    resourceId: v.id("resources"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resourceAssignments", {
      resourceId: args.resourceId,
      clientId: args.clientId,
      notified: false,
    });
  },
});
