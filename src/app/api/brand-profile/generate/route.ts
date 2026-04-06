import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

const BRAND_PROFILE_TEMPLATE = `Generate a comprehensive brand profile following this structure...`; // Will be loaded from template

export async function POST(req: NextRequest) {
  try {
    const pb = await createServerClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = pb.authStore.record?.id;
    const { sections } = await req.json();

    const adminPb = await createAdminClient();
    const clients = await adminPb.collection('clients').getFullList({ filter: `user_id = "${userId}"` });
    if (clients.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const client = clients[0];

    // Save all sections to brand_intake
    const intakeData: Record<string, any> = { client_id: client.id, submitted_at: new Date().toISOString() };
    for (const [sectionId, data] of Object.entries(sections)) {
      intakeData[sectionId] = JSON.stringify(data);
    }

    let intake;
    try {
      const intakes = await adminPb.collection('brand_intake').getFullList({ filter: `client_id = "${client.id}"` });
      intake = intakes[0];
      if (intake) {
        await adminPb.collection('brand_intake').update(intake.id, intakeData);
      }
    } catch {}

    if (!intake) {
      await adminPb.collection('brand_intake').create(intakeData);
    }

    // Create brand profile record with 'generating' status
    const profile = await adminPb.collection('brand_profiles').create({
      client_id: client.id,
      version: 1,
      content: '',
      status: 'generating',
      generated_at: new Date().toISOString(),
    });

    // Generate brand profile via Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;

    let profileContent = '';

    if (apiKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey });

        const questionnaireSummary = Object.entries(sections)
          .map(([section, data]) => `## ${section}\n${Object.entries(data as Record<string, string>).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`)
          .join('\n\n');

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are creating a comprehensive brand profile for a Rawgrowth client. Based on their questionnaire responses, generate a detailed brand profile in markdown format. Include sections for: Client Overview, Brand Voice, Content Pillars, Target Audience, Key Messaging, Competitor Positioning, Visual Style, Offer & Business Model, Origin Story, Goals & Metrics, Challenges, and AI Content Generation Guidelines.\n\nQuestionnaire Responses:\n${questionnaireSummary}\n\nGenerate the complete brand profile now. Be specific, actionable, and thorough.`,
          }],
        });

        profileContent = msg.content[0].type === 'text' ? msg.content[0].text : '';
      } catch (err) {
        console.error('Claude API error:', err);
        profileContent = `# Brand Profile for ${client.name || 'Client'}\n\n*Profile generation is pending. Our team will complete this shortly.*\n\n## Questionnaire Data Received\nAll ${Object.keys(sections).length} sections submitted successfully.`;
      }
    } else {
      profileContent = `# Brand Profile for ${client.name || 'Client'}\n\n*AI generation unavailable. Profile will be created manually by the Rawgrowth team.*\n\n## Questionnaire Submitted\nAll ${Object.keys(sections).length} sections received.`;
    }

    // Update profile with content
    await adminPb.collection('brand_profiles').update(profile.id, {
      content: profileContent,
      status: profileContent.includes('pending') || profileContent.includes('unavailable') ? 'generating' : 'ready',
    });

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `Brand profile generated for ${client.name || client.company}. Review at portal.rawgrowth.ai/admin/clients/${client.id}/brand-profile`);
    }

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (err: any) {
    console.error('Brand profile generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
