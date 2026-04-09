import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new client account (signup)
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Account already exists with this email");
    }

    const clientId = await ctx.db.insert("clients", {
      userId: args.email, // Use email as userId for now
      company: args.company,
      name: args.name,
      email: args.email,
      status: "onboarding",
      onboardingStep: 1,
      currentMonth: 1,
      healthScore: 0,
      role: "client",
    });

    // Create blank brand intake
    await ctx.db.insert("brandIntakes", {
      clientId,
    });

    // Create all 8 onboarding steps
    const steps = [
      "Welcome",
      "Questionnaire",
      "Brand Profile",
      "Brand Docs",
      "API Keys",
      "Software Access",
      "Schedule Calls",
      "Complete",
    ];
    for (let i = 0; i < steps.length; i++) {
      await ctx.db.insert("onboardingSteps", {
        clientId,
        stepNumber: i + 1,
        stepName: steps[i],
        completed: false,
      });
    }

    return clientId;
  },
});

// Get client by email (login)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get client by ID
export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.clientId);
  },
});

// Update onboarding step
export const updateOnboardingStep = mutation({
  args: {
    clientId: v.id("clients"),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Mark previous step as completed
    const prevStep = await ctx.db
      .query("onboardingSteps")
      .withIndex("by_clientId_step", (q) =>
        q.eq("clientId", args.clientId).eq("stepNumber", args.step - 1)
      )
      .first();

    if (prevStep && !prevStep.completed) {
      await ctx.db.patch(prevStep._id, {
        completed: true,
        completedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.clientId, {
      onboardingStep: args.step,
    });

    // If step 8, mark onboarding complete
    if (args.step > 8) {
      await ctx.db.patch(args.clientId, {
        status: "active",
        onboardingCompletedAt: Date.now(),
        onboardingStep: 8,
        healthScore: 85,
      });

      // Mark final step complete
      const finalStep = await ctx.db
        .query("onboardingSteps")
        .withIndex("by_clientId_step", (q) =>
          q.eq("clientId", args.clientId).eq("stepNumber", 8)
        )
        .first();
      if (finalStep) {
        await ctx.db.patch(finalStep._id, {
          completed: true,
          completedAt: Date.now(),
        });
      }
    }
  },
});

// Update messaging channel preference
export const updateMessaging = mutation({
  args: {
    clientId: v.id("clients"),
    channel: v.union(
      v.literal("telegram"),
      v.literal("slack"),
      v.literal("whatsapp")
    ),
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientId, {
      messagingChannel: args.channel,
      messagingHandle: args.handle,
    });
  },
});

// Get all clients (admin)
export const listAll = query({
  handler: async (ctx) => {
    return ctx.db.query("clients").collect();
  },
});

// Get onboarding steps for a client
export const getOnboardingSteps = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("onboardingSteps")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

// Get client by userId (email used as userId)
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Generic patch for admin updates
export const update = mutation({
  args: {
    clientId: v.id("clients"),
    fields: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientId, args.fields);
  },
});
