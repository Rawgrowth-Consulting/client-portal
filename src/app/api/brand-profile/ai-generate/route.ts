import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    const { data: profile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the brand intake
    const { data: intake } = await supabase
      .from("brand_intakes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (!intake) {
      return NextResponse.json({ error: "No brand intake found" }, { status: 404 });
    }

    // Build the prompt from intake data
    const sections = [
      intake.basic_info && Object.keys(intake.basic_info).length && `Basic Info: ${JSON.stringify(intake.basic_info)}`,
      intake.social_presence && Object.keys(intake.social_presence).length && `Social Presence: ${JSON.stringify(intake.social_presence)}`,
      intake.origin_story && Object.keys(intake.origin_story).length && `Origin Story: ${JSON.stringify(intake.origin_story)}`,
      intake.business_model && Object.keys(intake.business_model).length && `Business Model: ${JSON.stringify(intake.business_model)}`,
      intake.target_audience && Object.keys(intake.target_audience).length && `Target Audience: ${JSON.stringify(intake.target_audience)}`,
      intake.goals && Object.keys(intake.goals).length && `Goals: ${JSON.stringify(intake.goals)}`,
      intake.challenges && Object.keys(intake.challenges).length && `Challenges: ${JSON.stringify(intake.challenges)}`,
      intake.brand_voice && Object.keys(intake.brand_voice).length && `Brand Voice: ${JSON.stringify(intake.brand_voice)}`,
      intake.competitors && Object.keys(intake.competitors).length && `Competitors: ${JSON.stringify(intake.competitors)}`,
      intake.content_messaging && Object.keys(intake.content_messaging).length && `Content & Messaging: ${JSON.stringify(intake.content_messaging)}`,
      intake.sales && Object.keys(intake.sales).length && `Sales: ${JSON.stringify(intake.sales)}`,
      intake.tools_systems && Object.keys(intake.tools_systems).length && `Tools & Systems: ${JSON.stringify(intake.tools_systems)}`,
      intake.additional_context && Object.keys(intake.additional_context).length && `Additional Context: ${JSON.stringify(intake.additional_context)}`,
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
      await supabase
        .from("brand_profiles")
        .update({ content: "", status: "ready" })
        .eq("id", profileId);
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    await supabase
      .from("brand_profiles")
      .update({ content, status: "ready" })
      .eq("id", profileId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("AI brand profile generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
