import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const { clientId, profileId } = await req.json();

    if (!clientId || !profileId) {
      return NextResponse.json({ error: "Missing clientId or profileId" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Verify the profile exists and is in generating state
    const profile = await convex.query(api.brandProfile.get, {
      clientId: clientId as Id<"clients">,
    });

    if (!profile || profile._id !== profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the brand intake
    const intake = await convex.query(api.brandIntake.get, {
      clientId: clientId as Id<"clients">,
    });

    if (!intake) {
      return NextResponse.json({ error: "No brand intake found" }, { status: 404 });
    }

    // Build the prompt from intake data
    const sections = [
      intake.basicInfo && `Basic Info: ${JSON.stringify(intake.basicInfo)}`,
      intake.socialPresence && `Social Presence: ${JSON.stringify(intake.socialPresence)}`,
      intake.originStory && `Origin Story: ${JSON.stringify(intake.originStory)}`,
      intake.businessModel && `Business Model: ${JSON.stringify(intake.businessModel)}`,
      intake.targetAudience && `Target Audience: ${JSON.stringify(intake.targetAudience)}`,
      intake.goals && `Goals: ${JSON.stringify(intake.goals)}`,
      intake.challenges && `Challenges: ${JSON.stringify(intake.challenges)}`,
      intake.brandVoice && `Brand Voice: ${JSON.stringify(intake.brandVoice)}`,
      intake.competitors && `Competitors: ${JSON.stringify(intake.competitors)}`,
      intake.contentMessaging && `Content & Messaging: ${JSON.stringify(intake.contentMessaging)}`,
      intake.sales && `Sales: ${JSON.stringify(intake.sales)}`,
      intake.toolsSystems && `Tools & Systems: ${JSON.stringify(intake.toolsSystems)}`,
      intake.additionalContext && `Additional Context: ${JSON.stringify(intake.additionalContext)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = `You are a brand strategist building a comprehensive brand profile document for an AI department install. Based on the following intake data, generate a detailed brand profile in markdown format.

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

${sections}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      // Silently mark ready with empty content — team will fill it manually
      await convex.mutation(api.brandProfile.updateContent, {
        profileId: profileId as Id<"brandProfiles">,
        content: "",
        status: "ready",
      });
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    await convex.mutation(api.brandProfile.updateContent, {
      profileId: profileId as Id<"brandProfiles">,
      content,
      status: "ready",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("AI brand profile generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
