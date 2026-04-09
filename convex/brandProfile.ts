import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Get the latest brand profile for a client
export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (profiles.length === 0) return null;

    // Return the highest version
    return profiles.sort((a, b) => b.version - a.version)[0];
  },
});

// Update brand profile content (called by generation action)
export const updateContent = mutation({
  args: {
    profileId: v.id("brandProfiles"),
    content: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("approved")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      content: args.content,
      status: args.status,
    });
  },
});

// Approve a brand profile
export const approve = mutation({
  args: {
    profileId: v.id("brandProfiles"),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      status: "approved",
      approvedAt: Date.now(),
      approvedBy: args.approvedBy,
    });
  },
});

// Request regeneration with feedback
export const regenerate = mutation({
  args: {
    clientId: v.id("clients"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const latestVersion = profiles.length > 0
      ? Math.max(...profiles.map((p) => p.version))
      : 0;

    // Create new version in generating state
    const profileId = await ctx.db.insert("brandProfiles", {
      clientId: args.clientId,
      version: latestVersion + 1,
      content: "",
      status: "generating",
      generatedAt: Date.now(),
    });

    return profileId;
  },
});

// Generate brand profile using Claude API (action -- runs outside transaction)
export const generate = action({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    // Get the brand intake data
    const intake = await ctx.runQuery(api.brandIntake.get, {
      clientId: args.clientId,
    });

    if (!intake) throw new Error("No brand intake found");

    // Get or create the profile
    let profile = await ctx.runQuery(api.brandProfile.get, {
      clientId: args.clientId,
    });

    if (!profile) {
      throw new Error("No brand profile record found");
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      // If no API key, generate a placeholder
      await ctx.runMutation(api.brandProfile.updateContent, {
        profileId: profile._id,
        content:
          "Brand profile generation requires an Anthropic API key. Please contact the Rawgrowth team.",
        status: "ready",
      });
      return;
    }

    // Build the prompt from intake data
    const sections = [
      intake.basicInfo && `Basic Info: ${JSON.stringify(intake.basicInfo)}`,
      intake.socialPresence &&
        `Social Presence: ${JSON.stringify(intake.socialPresence)}`,
      intake.originStory &&
        `Origin Story: ${JSON.stringify(intake.originStory)}`,
      intake.businessModel &&
        `Business Model: ${JSON.stringify(intake.businessModel)}`,
      intake.targetAudience &&
        `Target Audience: ${JSON.stringify(intake.targetAudience)}`,
      intake.goals && `Goals: ${JSON.stringify(intake.goals)}`,
      intake.challenges && `Challenges: ${JSON.stringify(intake.challenges)}`,
      intake.brandVoice &&
        `Brand Voice: ${JSON.stringify(intake.brandVoice)}`,
      intake.competitors &&
        `Competitors: ${JSON.stringify(intake.competitors)}`,
      intake.contentMessaging &&
        `Content & Messaging: ${JSON.stringify(intake.contentMessaging)}`,
      intake.sales && `Sales: ${JSON.stringify(intake.sales)}`,
      intake.toolsSystems &&
        `Tools & Systems: ${JSON.stringify(intake.toolsSystems)}`,
      intake.additionalContext &&
        `Additional Context: ${JSON.stringify(intake.additionalContext)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a brand strategist building a comprehensive brand profile document for an AI department install. Based on the following intake data, generate a detailed brand profile in markdown format.

Include these sections:
1. Company Overview
2. Brand Identity & Voice
3. Target Audience / ICP
4. Content Strategy Framework
5. Sales Positioning
6. Competitive Landscape
7. Key Messaging Pillars
8. Recommended AI Agent Configuration (which agents to prioritize, what to train them on)

Be specific. Use their actual data, not generic templates. Write it as if you're briefing the AI agents that will work for this company.

${sections}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await ctx.runMutation(api.brandProfile.updateContent, {
        profileId: profile._id,
        content: `Error generating profile: ${error}`,
        status: "ready",
      });
      return;
    }

    const result = await response.json();
    const content =
      result.content?.[0]?.text || "Failed to generate brand profile.";

    await ctx.runMutation(api.brandProfile.updateContent, {
      profileId: profile._id,
      content,
      status: "ready",
    });
  },
});
