import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Client accounts
  clients: defineTable({
    userId: v.string(), // Convex auth user ID
    company: v.string(),
    name: v.string(),
    email: v.string(),
    status: v.union(
      v.literal("onboarding"),
      v.literal("active"),
      v.literal("churned")
    ),
    onboardingStep: v.number(),
    onboardingCompletedAt: v.optional(v.number()),
    currentMonth: v.number(),
    slackChannelId: v.optional(v.string()),
    healthScore: v.number(),
    role: v.union(v.literal("client"), v.literal("admin")),
    messagingChannel: v.optional(
      v.union(
        v.literal("telegram"),
        v.literal("slack"),
        v.literal("whatsapp")
      )
    ),
    messagingHandle: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Brand intake questionnaire responses
  brandIntakes: defineTable({
    clientId: v.id("clients"),
    basicInfo: v.optional(v.any()),
    socialPresence: v.optional(v.any()),
    originStory: v.optional(v.any()),
    businessModel: v.optional(v.any()),
    targetAudience: v.optional(v.any()),
    goals: v.optional(v.any()),
    challenges: v.optional(v.any()),
    brandVoice: v.optional(v.any()),
    competitors: v.optional(v.any()),
    contentMessaging: v.optional(v.any()),
    sales: v.optional(v.any()),
    toolsSystems: v.optional(v.any()),
    additionalContext: v.optional(v.any()),
    callData: v.optional(v.any()),
    submittedAt: v.optional(v.number()),
  }).index("by_clientId", ["clientId"]),

  // AI-generated brand profiles
  brandProfiles: defineTable({
    clientId: v.id("clients"),
    version: v.number(),
    content: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("approved")
    ),
    generatedAt: v.number(),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.string()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_version", ["clientId", "version"]),

  // Onboarding step tracking
  onboardingSteps: defineTable({
    clientId: v.id("clients"),
    stepNumber: v.number(),
    stepName: v.string(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    data: v.optional(v.any()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_step", ["clientId", "stepNumber"]),

  // Uploaded documents (logos, guidelines, assets)
  documents: defineTable({
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
  }).index("by_clientId", ["clientId"]),

  // API integrations / keys submitted by client
  apiIntegrations: defineTable({
    clientId: v.id("clients"),
    platform: v.string(),
    keyName: v.string(),
    keyHint: v.string(), // last 4 chars only
    notes: v.optional(v.string()),
  }).index("by_clientId", ["clientId"]),

  // Software access confirmations
  softwareAccess: defineTable({
    clientId: v.id("clients"),
    platform: v.string(),
    accessType: v.string(),
    confirmed: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_clientId", ["clientId"]),

  // Scheduled milestone calls
  scheduledCalls: defineTable({
    clientId: v.id("clients"),
    title: v.string(),
    month: v.number(),
    week: v.number(),
    calendlyUrl: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    completed: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_clientId", ["clientId"]),

  // Resources pushed to clients
  resources: defineTable({
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
  }),

  // Resource assignments to specific clients
  resourceAssignments: defineTable({
    resourceId: v.id("resources"),
    clientId: v.id("clients"),
    notified: v.boolean(),
    seenAt: v.optional(v.number()),
    downloadedAt: v.optional(v.number()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_resourceId", ["resourceId"]),

  // Activity feed events
  activityFeed: defineTable({
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
    readAt: v.optional(v.number()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_unread", ["clientId", "readAt"]),

  // Deliverables tracking
  deliverables: defineTable({
    clientId: v.id("clients"),
    month: v.number(),
    week: v.number(),
    title: v.string(),
    description: v.string(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
  }).index("by_clientId", ["clientId"]),

  // Magic links for passwordless auth
  magicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

});
