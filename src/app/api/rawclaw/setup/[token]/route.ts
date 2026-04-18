import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Returns the configuration package for a Rawclaw install.
// The token IS the client's Supabase `clients.id` (UUID).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, company, slack_channel_id, current_month")
      .eq("id", token)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const { data: intake } = await supabaseAdmin
      .from("brand_intakes")
      .select("*")
      .eq("client_id", client.id)
      .maybeSingle();

    const { data: brandProfile } = await supabaseAdmin
      .from("brand_profiles")
      .select("content")
      .eq("client_id", client.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const claudeMd = buildClaudeMd(client, intake, brandProfile);
    const agents = buildAgentConfigs(client);
    const knowledge = buildKnowledge(intake, brandProfile);

    return NextResponse.json({
      version: "1.0.0",
      client: {
        id: client.id,
        name: client.name,
        slug: slugify(client.company || client.name || ""),
        company: client.company,
        email: client.email,
        slackChannelId: client.slack_channel_id,
        currentMonth: client.current_month,
      },
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      claude_md: claudeMd,
      agents,
      knowledge,
    });
  } catch (err: any) {
    console.error("Setup token error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildClaudeMd(
  client: any,
  intake: any,
  brandProfile: { content?: string } | null
): string {
  const lines: string[] = [];

  lines.push(`# ${client.company} Business OS`);
  lines.push("");
  lines.push(`You are the AI department installed at ${client.company} by Rawgrowth.`);
  lines.push(`Client: ${client.name} (${client.email})`);
  lines.push("");

  if (intake?.basic_info) {
    const info = intake.basic_info;
    if (info.industry) lines.push(`Industry: ${info.industry}`);
    if (info.revenue_range) lines.push(`Revenue: ${info.revenue_range}`);
    if (info.team_size) lines.push(`Team Size: ${info.team_size}`);
    lines.push("");
  }

  if (intake?.target_audience) {
    lines.push("## Target Audience");
    for (const [k, v] of Object.entries(intake.target_audience as Record<string, any>)) {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    }
    lines.push("");
  }

  if (intake?.brand_voice) {
    lines.push("## Brand Voice");
    for (const [k, v] of Object.entries(intake.brand_voice as Record<string, any>)) {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    }
    lines.push("");
  }

  if (intake?.goals) {
    lines.push("## Goals");
    for (const [k, v] of Object.entries(intake.goals as Record<string, any>)) {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    }
    lines.push("");
  }

  if (brandProfile?.content) {
    lines.push("## Brand Profile");
    lines.push(brandProfile.content);
    lines.push("");
  }

  lines.push("## Core Rules");
  lines.push("1. Act, not ask. Execute unless >$2 cost or security risk.");
  lines.push("2. No outbound without approval.");
  lines.push(`3. All output must match ${client.company}'s brand voice.`);
  lines.push("4. Database is truth. If not stored, it did not happen.");
  lines.push("");

  lines.push("## Rawgrowth Support");
  lines.push("- Cleo (Client Success): cleo@rawgrowth.ai");
  lines.push("- Portal: portal.rawgrowth.ai");

  return lines.join("\n");
}

function buildAgentConfigs(client: any): Record<string, { claude_md: string; yaml: string }> {
  const company = client.company ?? "Client";
  const slug = slugify(company);

  return {
    quilly: {
      claude_md: `# Quilly -- Content Agent for ${company}\n\nYou create content for ${company}. Always match the brand voice defined in CLAUDE.md. Load brand-voice skill before any output.`,
      yaml: `name: quilly\nrole: Content Agent\nclient: ${slug}\nmodel: claude-sonnet-4-5\ntools:\n  - web_search\n  - file_write\n`,
    },
    larry: {
      claude_md: `# Larry -- Sales Agent for ${company}\n\nYou handle sales copy, DMs, proposals, and CRM for ${company}. Always match brand voice. Load brand-voice skill before any output.`,
      yaml: `name: larry\nrole: Sales Agent\nclient: ${slug}\nmodel: claude-sonnet-4-5\ntools:\n  - web_search\n  - file_write\n`,
    },
    ovi: {
      claude_md: `# Ovi -- Research Agent for ${company}\n\nYou handle competitive research and market intelligence for ${company}.`,
      yaml: `name: ovi\nrole: Research Agent\nclient: ${slug}\nmodel: claude-sonnet-4-5\ntools:\n  - web_search\n`,
    },
    cleo: {
      claude_md: `# Cleo -- Operations Agent for ${company}\n\nYou handle client comms, delivery SOPs, and operations for ${company}.`,
      yaml: `name: cleo\nrole: Ops Agent\nclient: ${slug}\nmodel: claude-sonnet-4-5\ntools:\n  - file_write\n`,
    },
  };
}

function buildKnowledge(
  intake: any,
  brandProfile: { content?: string } | null
): Record<string, string> {
  const knowledge: Record<string, string> = {};

  if (brandProfile?.content) {
    knowledge["brand/00-brand-profile.md"] = brandProfile.content;
  }

  if (intake?.competitors) {
    const lines = ["# Competitor Intelligence", ""];
    for (const [k, v] of Object.entries(intake.competitors as Record<string, any>)) {
      if (v) lines.push(`## ${k.replace(/_/g, " ")}\n${v}\n`);
    }
    knowledge["research/competitors.md"] = lines.join("\n");
  }

  if (intake?.sales) {
    const lines = ["# Sales Process", ""];
    for (const [k, v] of Object.entries(intake.sales as Record<string, any>)) {
      if (v) lines.push(`## ${k.replace(/_/g, " ")}\n${v}\n`);
    }
    knowledge["sales/process.md"] = lines.join("\n");
  }

  if (intake?.tools_systems) {
    const lines = ["# Tools & Systems", ""];
    for (const [k, v] of Object.entries(intake.tools_systems as Record<string, any>)) {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    }
    knowledge["ops/tools.md"] = lines.join("\n");
  }

  return knowledge;
}
