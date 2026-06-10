// Global dashboard learning modules served at /dashboard/resources and
// /dashboard/resources/[slug]. Same set for every client per Chris brief 2026-06-09 v2.
// Edit content in this file; v1 has no admin editor UI.

export type DashboardModule = {
  slug: string;
  title: string;
  summary: string;
  body_markdown: string;
};

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    slug: "how-rawclaw-works",
    title: "How RawClaw works",
    summary:
      "The mental model: named agents, your own infra, brand-voice tuned, weekly delivery.",
    body_markdown: `## The short version

RawClaw deploys a small team of named AI agents onto your own infrastructure. They live on a VPS you control, talk to your tools through a single integration layer, and produce work in your brand voice.

## What "named agents" means

Every agent has a role. Compass orchestrates ops. Voz writes client-facing copy. Scribe drafts content. Forge handles engineering. Atlas plans strategy. The names map to a department head in your business, not a generic AI persona.

## What "your own infra" means

Each client gets a dedicated VPS + a dedicated Supabase project. We don't pool your data with anyone else's. Tokens, files, conversation history — yours, scoped to your client_id.

## What "brand-voice tuned" means

Week 1 we capture your voice (this onboarding does most of it). Week 2-3 we iterate the system prompts until the Voz agent's drafts read like you typed them. Week 4 the loop closes — drafts go out with your approval cadence.

## What "weekly delivery" means

Every week we ship 1-3 new automations, a dashboard improvement, integration wiring, or prompt iteration. You see it in the dashboard's Impact tab.`,
  },
  {
    slug: "talk-to-agents",
    title: "How to talk to your agents",
    summary:
      "Plain English works. Be specific. Reference real numbers when you have them.",
    body_markdown: `## Channels

Your agents reach you through whatever you picked in onboarding (Telegram / Slack / WhatsApp). Same agents on every channel — the conversation history persists.

## Patterns that work

- Specific over generic: "draft a follow-up for the prospect who said they need budget approval" beats "write a sales email."
- Numbers over feel: "we close 4 of 10 demos, want to hit 6" beats "we want to close more."
- Voice samples: paste a recent email you wrote, ask the agent to match the tone.

## Patterns that don't

- Vague tasks with no success criterion.
- Asking the agent to "decide" things you haven't decided yet.
- Multi-week strategy in a single message — break it into steps.

## When to escalate to a human

If the agent's confidence is low, it should ask. If it doesn't, you can: "stop, get a human on this." That triggers a Slack ping to the Rawgrowth team.`,
  },
  {
    slug: "telegram-bots",
    title: "Telegram bots, the short version",
    summary:
      "Each agent has its own Telegram bot. Long-press to reply per-thread. Drafts wait for thumbs-up.",
    body_markdown: `## What you get

One Telegram bot per dept-head agent. Compass-bot, Voz-bot, etc. They live in a Telegram group or DM you on the personal account you provided.

## Replying

Long-press a message and pick "Reply" to keep threads coherent. Otherwise the bot reads the most recent message as context.

## Approving drafts

When an agent drafts a client-facing message, it asks "approve?" with thumbs-up / pencil-edit / thumbs-down. Thumbs-up = send. Pencil = inline edit. Thumbs-down = redraft with your feedback.

## Pausing a bot

Send "/pause" to any bot. It stops sending until you "/resume". Useful when you want to take over a thread manually.`,
  },
  {
    slug: "prompt-agents",
    title: "How to prompt agents (without prompting them)",
    summary:
      "Talk to them like a senior teammate. Drop context, state the outcome, leave the how to them.",
    body_markdown: `## The mental shift

You're not writing a prompt. You're briefing a team member. The difference: a team member already knows your business, your voice, and your tools. So skip the preamble.

## The four-line brief

1. **Context** — what's happening or what just happened.
2. **Outcome** — what you want true at the end.
3. **Constraint** — anything that's off-limits or required.
4. **Format** — Slack reply / email / Pipedrive note / 1-pager / etc.

## Example

> Context: Justin (CCM mortgage) just replied to my Tuesday DM with a question about pricing.
> Outcome: friendly reply that answers the price question AND books a 20-min call.
> Constraint: no commitments on a 30-day timeline; we said 6 weeks in the proposal.
> Format: WhatsApp message, ≤ 5 sentences.

## What to drop

- "Please" / "could you" / "I'd appreciate" — fine but not load-bearing.
- "Be helpful" / "be thorough" — the agent's system prompt covers this.
- Examples unless the request is unusual.`,
  },
  {
    slug: "approve-deny",
    title: "Approve, deny, edit — when to use each",
    summary:
      "Approve = ship. Edit = change once. Deny = rethink the approach.",
    body_markdown: `## Approve (✓)

Use when the draft is shippable as-is OR needs a one-word tweak you don't mind doing yourself before sending.

## Edit (pencil)

Use when the draft has the right shape but wrong wording. The agent re-reads your edited version + learns the delta for next time.

## Deny (✗)

Use when the draft missed the point. Always say WHY. The agent's brand-voice tuning loop reads denial reasons more carefully than approvals.

## What auto-approves after 3-5 weeks

If you approve the same TYPE of draft (e.g. weekly EOD recaps to Chris) without edits for 3-5 weeks straight, the agent moves it to auto-send. You'll see "AUTO" tagged on those messages in the dashboard.

## How to revoke auto-send

Reply "/manual" in the thread. Future messages of that type require approval again.`,
  },
  {
    slug: "customize-dashboard",
    title: "Customize your dashboard",
    summary:
      "V1 ships a fixed layout. Per-client custom tabs land in v1.1.",
    body_markdown: `## What you can change in v1

- Pin/unpin clients on the Impact tab.
- Reorder dashboard tabs via drag-handle on the left rail.
- Toggle dark/light theme (top-right gear).

## What's coming v1.1

- Custom tab per integration (your Pipedrive funnel, your Stripe MRR, etc.).
- Per-agent activity feed filter.
- Custom KPI cards driven by Composio queries.

## How to request a custom tab now

Send the request via the "Customize" link in the dashboard footer. We'll either ship it or tell you the gating reason.`,
  },
  {
    slug: "add-tools",
    title: "Add a new tool (Composio integration)",
    summary:
      "Tell us the toolkit, we generate a connect link, you click and authorize.",
    body_markdown: `## The flow

1. Tell Rawgrowth which tool to add (Slack / Pipedrive / Gmail / HubSpot / etc).
2. We create a Composio Auth Config on our side and generate a personalized connect link for you.
3. You click the link and OAuth into the tool (~30s).
4. Within 5 minutes, the agents can read/write that tool.

## Tools we connect easiest

Slack, Google Workspace, Calendly, Notion, Pipedrive, HubSpot, Stripe, Fireflies, GitHub, Linear — Composio-managed OAuth, just sign in.

## Tools that need extra setup

Pipedrive (one-time dev-app registration), Meta Ads (business manager scope), some niche CRMs. We'll walk you through if it comes up.

## What we will NOT auto-connect

Anything that sends to clients without your approval (WhatsApp auto-send, mass email blasts). That's a brand-voice + compliance call you make.`,
  },
  {
    slug: "request-skills",
    title: "Request new skills",
    summary:
      "A skill = a reusable workflow your agent should know. Describe the outcome; we build the steps.",
    body_markdown: `## What's a "skill"

A documented workflow your agent knows how to run on demand. E.g. "Weekly EOD recap" = pull yesterday's deals from Pipedrive + today's Calendar + open Linear issues → draft a Slack post in your voice.

## How to request one

Send a short description:
- Trigger (when to run it)
- Inputs (where to pull from)
- Output (where to send + in what format)
- Examples (a real output that would have been correct)

## How long it takes

Simple skill (one tool, fixed format): 1-3 days.
Multi-tool skill (CRM + email + calendar): 1 week.
Skill that needs a new integration: depends on the integration (see Add Tools).

## Where to send

Drop the request in your dedicated Slack channel with @rawgrowth, OR in the dashboard footer "Request Skill" link.`,
  },
  {
    slug: "agent-reports",
    title: "Understand agent reports",
    summary:
      "Daily / weekly / monthly. Time saved + drafts shipped + integrations status.",
    body_markdown: `## What agents report

- **Daily standup** (Mon-Fri, 09:00 local): what each agent did yesterday + plans today + any blockers.
- **Weekly recap** (Friday EOD): time saved, drafts shipped, approvals pending, integration health.
- **Monthly business review** (1st of month): KPI deltas vs last month, where the agents drove movement, where they didn't.

## How to read the time-saved number

It's measured against the baseline you reported in onboarding ("how many hours/week does this eat"). When an automation runs N times in a week and each run replaces ~X minutes of manual work, time saved = N × X. Conservative.

## How to read the integration health row

Green = healthy. Yellow = degraded (token expiring soon, rate-limited last hour). Red = broken (auth failed, tool unreachable). Click the row for the diagnostic.

## Where to find old reports

Dashboard → Activity tab → filter by "Agent Reports". Or search by date.`,
  },
  {
    slug: "sales-best-practices",
    title: "Best practices: sales automations",
    summary:
      "Capture every touchpoint. Draft fast, send slow. Measure cycle time, not just close rate.",
    body_markdown: `## What we automate well

- Lead-source attribution into your CRM.
- Discovery call recap → CRM note + Slack DM to you + draft proposal stub.
- Proposal follow-up cadence (day 2 / day 5 / day 9 nudges with progressively more direct language).
- Stalled-deal recovery (no reply in 14 days → 1-line re-engagement draft).

## What we leave to humans

- Pricing decisions on a specific deal.
- Discounts / scope changes.
- Anything where the prospect already pushed back hard once.

## The numbers we track

- Time from inbound DM → discovery call booked.
- Time from discovery → proposal sent.
- Time from proposal → close OR explicit no.
- % of proposals that ghost.

## Common mistake

Auto-sending follow-ups too fast. Default cadence is day 2 / day 5 / day 9 because that's what closes; faster reads as desperate. Trust the data.`,
  },
  {
    slug: "content-best-practices",
    title: "Best practices: content automations",
    summary:
      "Capture the idea live, draft fast, ship in your voice. Numbers > narrative.",
    body_markdown: `## What we automate well

- Idea capture (you say a line during a call → it lands in Notion / Linear / wherever you brief from).
- LinkedIn + X cross-post with platform-aware tweaks (long-form vs short-form).
- Comment-reply triage (sort viral-post replies into "real question / kind word / spam").
- Weekly content recap (which posts pulled engagement, which fell flat).

## What we leave to humans

- The original take. Agents draft, you sign.
- Anything sensitive (client metrics without permission, hot takes on competitors).
- First post of a new theme — agents need a couple of approved samples to learn.

## The brand-voice rules

- No em-dashes (we replace with "-" or period).
- No corporate fluff vocabulary (leverage / elevate / synergize — full ban list in your brand profile).
- First-person, opinionated, build-in-public flavor.
- Number > narrative: "we shipped 12 automations this week" beats "we shipped a lot."

## What "great" looks like

A post you'd be proud to have written yourself. The agent's bar is identical to yours — if it wouldn't pass your gut check, the agent shouldn't send it.`,
  },
];

export function getModuleBySlug(slug: string): DashboardModule | undefined {
  return DASHBOARD_MODULES.find((m) => m.slug === slug);
}
