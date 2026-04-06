const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function sendSlackMessage(channel: string, text: string) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('SLACK_BOT_TOKEN not set, skipping Slack message');
    return null;
  }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  });

  return res.json();
}

export async function sendSlackDM(userId: string, text: string) {
  if (!SLACK_BOT_TOKEN) return null;

  // Open DM channel first
  const openRes = await fetch('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: userId }),
  });
  const openData = await openRes.json();
  if (!openData.ok) return null;

  return sendSlackMessage(openData.channel.id, text);
}

export async function getSlackMessages(channelId: string, limit = 50) {
  if (!SLACK_BOT_TOKEN) return [];

  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channelId}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${SLACK_BOT_TOKEN}` },
    }
  );

  const data = await res.json();
  if (!data.ok) return [];

  // Get user info for display names
  const userIds = [...new Set(data.messages.map((m: any) => m.user).filter(Boolean))];
  const users: Record<string, string> = {};

  for (const uid of userIds) {
    try {
      const userRes = await fetch(
        `https://slack.com/api/users.info?user=${uid}`,
        { headers: { 'Authorization': `Bearer ${SLACK_BOT_TOKEN}` } }
      );
      const userData = await userRes.json();
      if (userData.ok) {
        users[uid as string] = userData.user.real_name || userData.user.name;
      }
    } catch {}
  }

  return data.messages.map((m: any) => ({
    id: m.ts,
    text: m.text,
    user: users[m.user] || m.user || 'Unknown',
    timestamp: m.ts,
    type: m.type,
  })).reverse();
}
