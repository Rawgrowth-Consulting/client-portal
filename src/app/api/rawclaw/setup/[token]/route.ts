import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// Returns the configuration package for a Rawclaw install
// The token is the client's Convex _id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    // Token is the client's Convex _id
    let client;
    try {
      client = await convex.query(api.clients.get, {
        clientId: token as Id<"clients">,
      });
    } catch {
      // Not a valid ID format
    }

    if (!client) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Get brand intake for CLAUDE.md generation
    const intake = await convex.query(api.brandIntake.get, { clientId: client._id });

    // Get brand profile
    const brandProfile = await convex.query(api.brandProfile.get, { clientId: client._id });

    // Build CLAUDE.md from intake data
    const claudeMd = buildClaudeMd(client, intake, brandProfile);

    // Build agent configs (standard rawclaw agents)
    const agents = buildAgentConfigs(client);

    // Build knowledge base
    const knowledge = buildKnowledge(client, intake, brandProfile);

    const configPackage = {
      version: "1.0.0",
      client: {
        id: client._id,
        name: client.name,
        slug: slugify(client.company),
        company: client.company,
        email: client.email,
        slackChannelId: client.slackChannelId,
        currentMonth: client.currentMonth,
      },
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || "https://adjoining-scorpion-918.convex.cloud",
      claude_md: claudeMd,
      agents,
      knowledge,
    };

    return NextResponse.json(configPackage);
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

function buildClaudeMd(client: any, intake: any, brandProfile: any): string {
  const lines: string[] = [];

  lines.push(`# ${client.company} Business OS`);
  lines.push("");
  lines.push(`You are the AI department installed at ${client.company} by Rawgrowth.`);
  lines.push(`Client: ${client.name} (${client.email})`);
  lines.push("");

  if (intake?.basicInfo) {
    const info = intake.basicInfo;
    if (info.industry) lines.push(`Industry: ${info.industry}`);
    if (info.revenue_range) lines.push(`Revenue: ${info.revenue_range}`);
    if (info.team_size) lines.push(`Team Size: ${info.team_size}`);
    lines.push("");
  }

  if (intake?.targetAudience) {
    const ta = intake.targetAudience;
    lines.push("## Target Audience");
    Object.entries(ta).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    });
    lines.push("");
  }

  if (intake?.brandVoice) {
    const bv = intake.brandVoice;
    lines.push("## Brand Voice");
    Object.entries(bv).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    });
    lines.push("");
  }

  if (intake?.goals) {
    lines.push("## Goals");
    Object.entries(intake.goals).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    });
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
  const company = client.company;
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
  client: any,
  intake: any,
  brandProfile: any
): Record<string, string> {
  const knowledge: Record<string, string> = {};

  if (brandProfile?.content) {
    knowledge["brand/00-brand-profile.md"] = brandProfile.content;
  }

  if (intake?.competitors) {
    const lines = ["# Competitor Intelligence", ""];
    Object.entries(intake.competitors).forEach(([k, v]) => {
      if (v) lines.push(`## ${k.replace(/_/g, " ")}\n${v}\n`);
    });
    knowledge["research/competitors.md"] = lines.join("\n");
  }

  if (intake?.sales) {
    const lines = ["# Sales Process", ""];
    Object.entries(intake.sales).forEach(([k, v]) => {
      if (v) lines.push(`## ${k.replace(/_/g, " ")}\n${v}\n`);
    });
    knowledge["sales/process.md"] = lines.join("\n");
  }

  if (intake?.toolsSystems) {
    const lines = ["# Tools & Systems", ""];
    Object.entries(intake.toolsSystems).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, " ")}: ${v}`);
    });
    knowledge["ops/tools.md"] = lines.join("\n");
  }

  return knowledge;
}
