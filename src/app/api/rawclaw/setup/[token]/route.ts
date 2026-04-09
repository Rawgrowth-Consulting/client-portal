import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/pb-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || !token.startsWith('RG-')) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
  }

  try {
    const adminPb = await createAdminClient();

    // Look up the token
    let tokenRecord: any;
    try {
      const records = await adminPb.collection('rawclaw_setup_tokens').getFullList({
        filter: `token = "${token}" && consumed = false`,
      });
      if (records.length === 0) {
        return NextResponse.json({ error: 'Token not found or already used' }, { status: 404 });
      }
      tokenRecord = records[0];
    } catch {
      return NextResponse.json({ error: 'Token not found or already used' }, { status: 404 });
    }

    // Get client
    const client = await adminPb.collection('clients').getOne(tokenRecord.client_id);

    // Get brand intake for CLAUDE.md generation
    let intake: any = null;
    try {
      const intakes = await adminPb.collection('brand_intakes').getFullList({
        filter: `client_id = "${client.id}"`,
      });
      intake = intakes[0] || null;
    } catch {}

    // Get brand profile
    let brandProfile: any = null;
    try {
      const profiles = await adminPb.collection('brand_profiles').getFullList({
        filter: `client_id = "${client.id}"`,
        sort: '-version',
      });
      brandProfile = profiles[0] || null;
    } catch {}

    // Build CLAUDE.md from intake data
    const claudeMd = buildClaudeMd(client, intake, brandProfile);

    // Build agent configs (standard rawclaw agents)
    const agents = buildAgentConfigs(client);

    // Build knowledge base
    const knowledge = buildKnowledge(client, intake, brandProfile);

    // Consume the token (one-time use)
    await adminPb.collection('rawclaw_setup_tokens').update(tokenRecord.id, {
      consumed: true,
      consumed_at: new Date().toISOString(),
    });

    const configPackage = {
      version: '1.0.0',
      client: {
        name: client.name,
        slug: slugify(client.company),
        company: client.company,
      },
      claude_md: claudeMd,
      agents,
      knowledge,
    };

    return NextResponse.json(configPackage);
  } catch (err: any) {
    console.error('Setup token error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildClaudeMd(client: any, intake: any, brandProfile: any): string {
  const lines: string[] = [];

  lines.push(`# ${client.company} Business OS`);
  lines.push('');
  lines.push(`You are the AI department installed at ${client.company} by Rawgrowth.`);
  lines.push(`Client: ${client.name} (${client.email})`);
  lines.push('');

  if (intake?.basic_info) {
    const info = intake.basic_info;
    if (info.industry) lines.push(`Industry: ${info.industry}`);
    if (info.revenue_range) lines.push(`Revenue: ${info.revenue_range}`);
    if (info.team_size) lines.push(`Team Size: ${info.team_size}`);
    lines.push('');
  }

  if (intake?.target_audience) {
    const ta = intake.target_audience;
    lines.push('## Target Audience');
    Object.entries(ta).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, ' ')}: ${v}`);
    });
    lines.push('');
  }

  if (intake?.brand_voice) {
    const bv = intake.brand_voice;
    lines.push('## Brand Voice');
    Object.entries(bv).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, ' ')}: ${v}`);
    });
    lines.push('');
  }

  if (intake?.goals) {
    lines.push('## Goals');
    Object.entries(intake.goals).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, ' ')}: ${v}`);
    });
    lines.push('');
  }

  if (brandProfile?.content) {
    lines.push('## Brand Profile');
    lines.push(brandProfile.content);
    lines.push('');
  }

  lines.push('## Core Rules');
  lines.push('1. Act, not ask. Execute unless >$2 cost or security risk.');
  lines.push('2. No outbound without approval.');
  lines.push(`3. All output must match ${client.company}'s brand voice.`);
  lines.push('4. Database is truth. If not stored, it did not happen.');
  lines.push('');

  lines.push('## Rawgrowth Support');
  lines.push('- Cleo (Client Success): cleo@rawgrowth.ai');
  lines.push('- Portal: portal.rawgrowth.ai');

  return lines.join('\n');
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
    knowledge['brand/00-brand-profile.md'] = brandProfile.content;
  }

  if (intake?.competitors) {
    const lines = ['# Competitor Intelligence', ''];
    Object.entries(intake.competitors).forEach(([k, v]) => {
      if (v) lines.push(`## ${k.replace(/_/g, ' ')}\n${v}\n`);
    });
    knowledge['research/competitors.md'] = lines.join('\n');
  }

  if (intake?.sales) {
    const lines = ['# Sales Process', ''];
    Object.entries(intake.sales).forEach(([k, v]) => {
      if (v) lines.push(`## ${k.replace(/_/g, ' ')}\n${v}\n`);
    });
    knowledge['sales/process.md'] = lines.join('\n');
  }

  if (intake?.tools_systems) {
    const lines = ['# Tools & Systems', ''];
    Object.entries(intake.tools_systems).forEach(([k, v]) => {
      if (v) lines.push(`- ${k.replace(/_/g, ' ')}: ${v}`);
    });
    knowledge['ops/tools.md'] = lines.join('\n');
  }

  return knowledge;
}
