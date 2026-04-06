import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createAdminClient } from '@/lib/pb-server';
import { sendSlackMessage } from '@/lib/slack';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { step, data } = await req.json();

    const adminPb = await createAdminClient();

    // Get client
    const clients = await adminPb.collection('clients').getFullList({
      filter: `user_id = "${userId}"`,
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clients[0];

    // Save or update onboarding step data
    const existingSteps = await adminPb.collection('onboarding_steps').getFullList({
      filter: `client_id = "${client.id}" && step_number = ${step}`,
    });

    const stepNames: Record<number, string> = {
      1: 'Welcome', 2: 'Questionnaire', 3: 'Brand Profile', 4: 'Brand Documents',
      5: 'API Keys', 6: 'Software Access', 7: 'Schedule Calls', 8: 'Complete',
    };

    if (existingSteps.length > 0) {
      await adminPb.collection('onboarding_steps').update(existingSteps[0].id, {
        completed: true,
        completed_at: new Date().toISOString(),
        data: JSON.stringify(data || {}),
      });
    } else {
      await adminPb.collection('onboarding_steps').create({
        client_id: client.id,
        step_number: step,
        step_name: stepNames[step] || `Step ${step}`,
        completed: true,
        completed_at: new Date().toISOString(),
        data: JSON.stringify(data || {}),
      });
    }

    // Update client onboarding_step
    const nextStep = Math.min(step + 1, 8);
    const updateData: Record<string, any> = { onboarding_step: nextStep };

    // If step 1, save slack info
    if (step === 1 && data?.slack_channel) {
      updateData.slack_channel_id = data.slack_channel;
    }

    // If step 8, mark onboarding complete
    if (step === 8) {
      updateData.onboarding_completed_at = new Date().toISOString();
      updateData.status = 'active';
    }

    await adminPb.collection('clients').update(client.id, updateData);

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(slackChannel, `${client.name} completed onboarding step ${step}: ${stepNames[step]}`);
    }

    return NextResponse.json({ success: true, nextStep });
  } catch (err: any) {
    console.error('Onboarding step error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
