export type StageColor =
  | 'outbound'
  | 'booking'
  | 'call'
  | 'noshow'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'onboarding'
  | 'setup'
  | 'fulfillment'
  | 'reactivation'
  | 'lost';

export interface SOPStep {
  step: string;
  detail?: string;
  tool?: string;
  template?: string;
  time?: string;
}

export interface SOPNode {
  id: string;
  label: string;
  sublabel?: string;
  stage: StageColor;
  type: 'stage' | 'action' | 'decision' | 'outcome' | 'sequence';
  sop: {
    title: string;
    owner: string;
    timeframe?: string;
    objective?: string;
    steps: SOPStep[];
    scripts?: Record<string, string>;
    metrics?: Record<string, string>;
    bottleneckFlag?: string;
  };
}

export const STAGE_COLORS: Record<StageColor, { bg: string; border: string; text: string; badge: string }> = {
  outbound:     { bg: '#0f172a', border: '#3b82f6', text: '#93c5fd', badge: '#3b82f6' },
  booking:      { bg: '#0f172a', border: '#8b5cf6', text: '#c4b5fd', badge: '#8b5cf6' },
  call:         { bg: '#0f172a', border: '#22c55e', text: '#86efac', badge: '#22c55e' },
  noshow:       { bg: '#0f172a', border: '#f59e0b', text: '#fcd34d', badge: '#f59e0b' },
  proposal:     { bg: '#0f172a', border: '#6366f1', text: '#a5b4fc', badge: '#6366f1' },
  negotiation:  { bg: '#0f172a', border: '#f97316', text: '#fdba74', badge: '#f97316' },
  won:          { bg: '#0f172a', border: '#10b981', text: '#6ee7b7', badge: '#10b981' },
  onboarding:   { bg: '#0f172a', border: '#14b8a6', text: '#5eead4', badge: '#14b8a6' },
  setup:        { bg: '#0f172a', border: '#06b6d4', text: '#67e8f9', badge: '#06b6d4' },
  fulfillment:  { bg: '#0f172a', border: '#0CBF6A', text: '#86efac', badge: '#0CBF6A' },
  reactivation: { bg: '#0f172a', border: '#f43f5e', text: '#fda4af', badge: '#f43f5e' },
  lost:         { bg: '#0f172a', border: '#64748b', text: '#94a3b8', badge: '#64748b' },
};

export const SOP_NODES: SOPNode[] = [
  // ─── OUTBOUND ───────────────────────────────────────────────
  {
    id: 'prospect',
    label: 'Prospect Identified',
    sublabel: 'ICP match confirmed',
    stage: 'outbound',
    type: 'stage',
    sop: {
      title: 'Prospect Identification & Qualification',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Before first contact',
      objective: 'Confirm the lead is a genuine ICP match before spending time on outreach.',
      steps: [
        { step: 'Pull company info', detail: 'Revenue range $3M-$15M, consulting or agency model, 10-200 person team', tool: 'LinkedIn / Apollo' },
        { step: 'Check decision-maker access', detail: 'Can we get to the actual owner or C-suite? If gatekeeper only, deprioritize.' },
        { step: 'Look for buying signals', detail: 'Hiring AI roles, posting about ops pain, recent funding, growth content', tool: 'LinkedIn activity' },
        { step: 'Score the lead 1-5', detail: '5 = perfect ICP + signals. 3+ = proceed. Below 3 = add to low-priority sequence.' },
        { step: 'Create GHL contact', detail: 'Add to pipeline stage: Prospect', tool: 'GHL' },
        { step: 'Log to hive mind', detail: 'Record lead ID, score, and source channel', tool: 'SQLite' },
      ],
      metrics: {
        'ICP match rate target': '70%+ of outreach attempts',
        'Avg lead score': '3.5+',
      },
      bottleneckFlag: 'If scoring below 3 frequently, ICP definition needs tightening.',
    },
  },
  {
    id: 'dm-outreach',
    label: 'DM / Cold Outreach Sent',
    sublabel: 'Instagram, LinkedIn, or email',
    stage: 'outbound',
    type: 'action',
    sop: {
      title: 'First Touch Outreach',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Day 1',
      objective: 'Get a reply. Not to sell. One goal: start a conversation.',
      steps: [
        { step: 'Select channel', detail: 'Instagram DM for personal brands. LinkedIn for B2B. Cold email for enterprise.' },
        { step: 'Personalize the opener', detail: 'Reference something specific: recent post, hire, content, pain they shared publicly. Never use a generic opener.' },
        { step: 'One sentence on what we do', detail: '"We install AI departments into agencies so your team stops doing $20/hr work."' },
        { step: 'Soft CTA', detail: '"Would it make sense to show you what that looks like for [company]?" -- not "book a call"' },
        { step: 'Log send in GHL', detail: 'Stage: Contacted. Note the channel and first message sent.', tool: 'GHL' },
      ],
      scripts: {
        'Instagram DM': `Hey [Name] -- saw your post on [topic]. We're helping agencies like yours build out their AI department so your team stops doing tasks that shouldn't need a human. Would it make sense to show you what that looks like for [company]?`,
        'LinkedIn': `Hi [Name] -- noticed you're scaling [company] and [specific observation]. We install AI departments into consulting firms -- the kind that actually run ops, not just answer questions. Worth 15 minutes to see if it fits?`,
        'Cold Email Subject': `AI department for [Company]`,
        'Cold Email Body': `Hey [Name],\n\nSaw [specific signal]. Quick one:\n\nWe install AI departments into $3M-$15M agencies -- the full setup, trained on your business, running ops from day one.\n\nWorth 15 minutes to see if it fits [Company]?\n\n[Calendly link]`,
      },
      metrics: {
        'Reply rate target': '15-25%',
        'Positive reply rate': '8-12%',
      },
      bottleneckFlag: 'Reply rate below 10%: audit opener personalization and channel fit.',
    },
  },
  {
    id: 'no-reply',
    label: 'No Reply',
    sublabel: '48h after first touch',
    stage: 'outbound',
    type: 'decision',
    sop: {
      title: 'No-Reply Follow-Up Sequence',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Day 3 / Day 7 / Day 14',
      objective: 'Get a response without being annoying. Three touches max before cold sequence.',
      steps: [
        { step: 'Touch 2 (Day 3)', detail: 'Different angle. Share a case study result or ask a genuine question about their business. No "just following up."', time: 'Day 3' },
        { step: 'Touch 3 (Day 7)', detail: 'Add value. Link to something relevant (a piece of content, stat, example). Short.', time: 'Day 7' },
        { step: 'Touch 4 - the break-up (Day 14)', detail: '"I\'ll leave you alone after this. If the timing\'s off, no worries -- just let me know and I\'ll circle back in a few months."', time: 'Day 14' },
        { step: 'Move to Cold Sequence', detail: 'If no response after 4 touches, move to GHL stage: Cold / Reactivation in 90 days', tool: 'GHL' },
      ],
      scripts: {
        'Touch 2': `Hey [Name] -- one thing I forgot to mention: we built [client type]'s entire AI ops layer in 3 weeks. They went from 4 manual hours/day on [task] to zero. Thought it might be relevant given what you're building.`,
        'Touch 3': `Random but -- saw [industry news/stat]. We're seeing agencies use this as a forcing function to build AI infra before their competitors do. Let me know if you want to see how we'd approach [company].`,
        'Break-Up': `Hey [Name] -- won't keep bugging you. If the timing's off, totally fine. I'll check back in a few months. If you ever want to see what an AI department looks like for [company], you know where to find me.`,
      },
      metrics: {
        'Touch 2-4 recovery rate': '5-8% of no-replies',
      },
    },
  },
  {
    id: 'interested',
    label: 'Interest Confirmed',
    sublabel: 'Replied positively',
    stage: 'outbound',
    type: 'action',
    sop: {
      title: 'Interest Confirmed -- Move to Booking',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Within 2 hours of reply',
      objective: 'Get them booked before the interest cools. Speed is the variable here.',
      steps: [
        { step: 'Acknowledge in 1 sentence', detail: 'Don\'t over-explain. Don\'t pitch. Keep the energy light.' },
        { step: 'Send Calendly link immediately', detail: 'Use the 30-min discovery call link. Include 1-line on what to expect.', tool: 'Calendly' },
        { step: 'Update GHL', detail: 'Stage: Meeting Requested', tool: 'GHL' },
        { step: 'Set 24h reminder task', detail: 'If they haven\'t booked in 24h, send one gentle nudge with the link again.' },
      ],
      scripts: {
        'Booking reply': `Nice -- here's a link to grab time: [calendly link]\n\nIt's a 30-min call. I'll show you exactly what the install looks like and we'll figure out if it makes sense for [company].`,
        '24h nudge': `Hey -- wanted to make sure the link came through. Here it is again: [calendly link]`,
      },
      metrics: {
        'Interest to booked rate': '60%+',
        'Time to book target': 'Under 24 hours',
      },
      bottleneckFlag: 'If they express interest but don\'t book, friction is in the booking step. Check Calendly UX.',
    },
  },

  // ─── BOOKING ─────────────────────────────────────────────────
  {
    id: 'call-booked',
    label: 'Call Booked',
    sublabel: 'GHL: Call Booked stage',
    stage: 'booking',
    type: 'stage',
    sop: {
      title: 'Call Booked -- Pre-Call Sequence Starts',
      owner: 'GHL Automation + Larry',
      timeframe: 'Immediately on booking',
      objective: 'Warm them up before the call. Reduce no-shows. Set expectations.',
      steps: [
        { step: 'Calendly webhook fires', detail: 'GHL contact moves to "Call Booked" stage automatically', tool: 'Calendly + GHL webhook' },
        { step: 'Confirmation email sent (auto)', detail: 'Calendar invite + what to expect on the call', tool: 'GHL Automation' },
        { step: 'Pre-call research', detail: 'Larry pulls company info, LinkedIn, recent content, any GHL history', tool: 'Larry (Sales Agent)' },
        { step: '24h before: reminder SMS + email', detail: '"Looking forward to tomorrow. Here\'s what we\'ll cover..." + Zoom link', tool: 'GHL Automation' },
        { step: '1h before: reminder SMS', detail: 'Short. Just the Zoom link and time.', tool: 'GHL Automation' },
        { step: 'Prep call brief', detail: 'Larry generates a 1-page brief: company overview, signals, what to address, suggested approach', tool: 'Larry (Sales Agent)' },
      ],
      scripts: {
        'Confirmation email': `Hey [Name],\n\nYou're booked for [date/time]. Here's the Zoom link: [link]\n\nOn the call we'll:\n- Look at your current ops setup\n- Show you exactly what an AI department install looks like\n- Be straight with you on whether it's the right fit\n\nNo pitch deck. No fluff. See you then.\n\nChris`,
        '24h reminder': `Hey [Name] -- see you tomorrow at [time]. Zoom: [link]\n\nIf something comes up, here's the reschedule link: [link]`,
        '1h reminder': `[Name] -- 1 hour out. Zoom: [link]`,
      },
      metrics: {
        'No-show rate target': 'Under 15%',
        'Show rate target': '85%+',
      },
      bottleneckFlag: 'No-show rate above 20%: audit reminder cadence and qualification step.',
    },
  },

  // ─── NO-SHOW ─────────────────────────────────────────────────
  {
    id: 'no-show',
    label: 'No-Show',
    sublabel: 'Missed the call',
    stage: 'noshow',
    type: 'decision',
    sop: {
      title: 'No-Show Recovery Sequence',
      owner: 'Larry (Sales Agent) + GHL',
      timeframe: 'Starts immediately after missed call',
      objective: 'Recover the meeting without burning the relationship. Speed matters.',
      steps: [
        { step: 'Immediate (0-15 min): "We missed you" text', detail: 'Short, warm, no guilt. Drop reschedule link.', time: '0-15 min' },
        { step: '2h: Email with reschedule link', detail: 'Slightly more detail. Reference what they were going to see.', time: '2 hours' },
        { step: 'Day 2: Personal follow-up DM', detail: 'Not automated. Human message. Check if everything\'s okay, offer new time.', time: 'Day 2' },
        { step: 'Day 5: Final reschedule attempt', detail: 'Brief. "Last time I\'ll reach out on this -- want to get you rescheduled or close the loop."', time: 'Day 5' },
        { step: 'Day 14: Move to Reactivation sequence', detail: 'Tag in GHL: No-Show / Reactivate. Add to 30-day reactivation campaign.', tool: 'GHL' },
        { step: 'Update GHL stage', detail: 'Move to "No-Show" stage. Log all attempts.', tool: 'GHL' },
      ],
      scripts: {
        'Immediate text': `Hey [Name] -- looks like we missed each other. No worries at all. Here's a link to grab a new time: [link]`,
        '2h email': `Hey [Name],\n\nWe had a call scheduled today -- looks like it slipped through. Totally fine.\n\nHere's a link to reschedule: [link]\n\nWe were going to walk through what an AI department install looks like for [company]. Worth 30 minutes when you're ready.\n\nChris`,
        'Day 2 DM': `Hey [Name] -- just wanted to check in, hope everything's good. Whenever you're ready to reconnect, I'm here. Here's the link: [calendly]`,
        'Day 5 final': `Hey [Name] -- last one, I promise. If the timing's off just say the word and I'll circle back in a few months. Otherwise, grab a time here: [link]`,
      },
      metrics: {
        'No-show recovery rate': '25-35%',
      },
      bottleneckFlag: 'Recovery below 20%: the no-show is probably not a real ICP fit. Review qualification process.',
    },
  },

  // ─── DISCOVERY CALL ──────────────────────────────────────────
  {
    id: 'discovery-call',
    label: 'Discovery Call',
    sublabel: '30-min call with Chris',
    stage: 'call',
    type: 'stage',
    sop: {
      title: 'Discovery Call SOP',
      owner: 'Chris West',
      timeframe: '30 minutes',
      objective: 'Understand their operation, identify the AI gap, and determine if we can deliver 10x their investment. If yes, set the proposal as the next step.',
      steps: [
        { step: 'Open (2 min)', detail: 'Thank them for their time. Set the frame: "This is a conversation, not a pitch. I want to understand what you\'re working with before we talk about solutions."' },
        { step: 'Company overview (5 min)', detail: 'Revenue range? Team size? Core offer? How long have they been operating?', tool: 'Discovery questions' },
        { step: 'Current ops (8 min)', detail: 'Where are the manual bottlenecks? What\'s taking the most time? What would they automate first if they could?', tool: 'Discovery questions' },
        { step: 'AI awareness check (3 min)', detail: 'What are they using now? Have they tried anything? What worked/didn\'t?' },
        { step: 'Paint the picture (7 min)', detail: 'Show them what an AI department looks like. Reference a similar client result. Be specific.' },
        { step: 'Fit check (3 min)', detail: 'Be straight: "Based on what you\'ve told me, here\'s my honest take on fit..."' },
        { step: 'Next step (2 min)', detail: 'If fit: "I\'ll send you a custom proposal within 24 hours." If not fit: be honest and refer out or revisit in 6 months.' },
      ],
      scripts: {
        'Frame opener': `I want to make sure this is actually worth your time. So I'm going to ask you some direct questions about how your business runs, and then I'll be straight with you about whether what we do is a fit. Sound good?`,
        'Core discovery questions': `What does your team spend the most time on that feels like it shouldn't need a human?\n\nIf you had 20 extra hours a week back, where would you put them?\n\nWhat's the one thing in your ops that's holding your growth back right now?\n\nHave you tried any AI tools? What happened?`,
        'Fit confirmation': `Based on what you've told me, I think there's a real fit here. Here's why: [specific]. I'll send you a custom proposal within 24 hours that shows exactly what the install looks like for [company].`,
        'No-fit close': `I want to be straight with you -- based on what you're describing, I don't think we're the right fit right now. Here's why: [reason]. I'd rather tell you that now than waste your time and money.`,
      },
      metrics: {
        'Call to proposal rate': '70%+',
        'Avg call duration': '25-30 min',
      },
      bottleneckFlag: 'Below 60% conversion to proposal: review call framework and ICP qualification.',
    },
  },
  {
    id: 'call-scored',
    label: 'Call Scored',
    sublabel: 'Lead quality 1-5',
    stage: 'call',
    type: 'action',
    sop: {
      title: 'Post-Call Lead Scoring',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Within 30 min of call',
      objective: 'Accurately score the lead so follow-up effort matches real opportunity.',
      steps: [
        { step: 'Review call notes / transcript', detail: 'Larry pulls the call summary or Granola notes', tool: 'Granola / GHL notes' },
        { step: 'Score 1-5', detail: '5: Perfect ICP, clear pain, budget confirmed, buying signals. 4: Good fit, needs proposal. 3: Possible fit, needs nurture. 2: Not ready, check back in 6 months. 1: Not a fit.' },
        { step: 'Update GHL', detail: 'Log score, key pain points, objections mentioned, decision timeline', tool: 'GHL' },
        { step: 'Route based on score', detail: 'Score 4-5: Proposal within 24h. Score 3: Nurture sequence. Score 1-2: Long-term or disqualify.' },
        { step: 'Create proposal brief', detail: 'Document: company name, pain points, proposed solution, pricing recommendation, specific ROI angle for this client' },
      ],
      metrics: {
        'Score 4-5 rate': '50%+ of calls taken',
        'Score 1-2 rate target': 'Under 20% (means qualification is working)',
      },
    },
  },

  // ─── PROPOSAL ────────────────────────────────────────────────
  {
    id: 'proposal-sent',
    label: 'Proposal Sent',
    sublabel: 'Within 24h of call',
    stage: 'proposal',
    type: 'stage',
    sop: {
      title: 'Proposal Creation and Delivery',
      owner: 'Larry (Sales Agent) + Chris',
      timeframe: 'Within 24 hours of call',
      objective: 'Send a proposal that feels custom-built for this specific client. Not a template.',
      steps: [
        { step: 'Generate proposal', detail: 'Larry runs /proposal skill: pulls call notes, GHL data, company research', tool: 'Larry + /proposal skill' },
        { step: 'Customize pricing', detail: 'Minimum $15K setup + $10K/mo. Adjust based on scope, team size, complexity. Never quote fixed rates in copy.', tool: 'proposal.rawgrowth.ai' },
        { step: 'Build proposal page', detail: 'Live at proposal.rawgrowth.ai/[slug]. Custom to this client.', tool: 'proposal.rawgrowth.ai' },
        { step: 'Chris review', detail: 'Chris reviews before sending. 5-min check on positioning and price.' },
        { step: 'Send with context', detail: 'Email + DM with the link. 1 paragraph on what\'s inside. Reference something specific from the call.' },
        { step: 'Update GHL', detail: 'Stage: Proposal Sent. Log the proposal URL.', tool: 'GHL' },
        { step: 'Set follow-up task', detail: '48h follow-up reminder. Assign to Larry.', tool: 'GHL' },
      ],
      scripts: {
        'Proposal send email': `Hey [Name],\n\nHere's the proposal: [link]\n\nI built it specifically around what you told me on the call -- particularly [specific pain point]. You'll see the install breakdown, what Month 1 looks like, and the expected ROI based on [their situation].\n\nLet me know if you have questions. Happy to walk through it on a quick call.\n\nChris`,
        'Proposal send DM': `Hey [Name] -- proposal is live: [link]. Built it around [specific thing from call]. Let me know what you think.`,
      },
      metrics: {
        'Proposal send rate': '100% of score 4-5 leads within 24h',
        'Proposal view rate': '85%+',
        'Proposal to close rate': '40-50%',
      },
      bottleneckFlag: 'View rate below 70%: audit delivery method and subject line. Close rate below 30%: audit proposal content and pricing.',
    },
  },
  {
    id: 'follow-up-1',
    label: 'Follow-Up 1',
    sublabel: '48h after proposal',
    stage: 'proposal',
    type: 'sequence',
    sop: {
      title: 'Follow-Up 1 -- 48 Hours',
      owner: 'Larry (Sales Agent)',
      timeframe: '48 hours after proposal sent',
      objective: 'Check in without being pushy. Give them an opening to share their thoughts.',
      steps: [
        { step: 'Send follow-up DM or email', detail: 'Short. Reference the proposal. Ask one question.', time: '48h' },
        { step: 'Update GHL', detail: 'Log FU1 sent. Move to "Follow-Up 1" stage if not already.', tool: 'GHL' },
        { step: 'If they reply with objection', detail: 'Route to Objection Handling SOP' },
        { step: 'If no reply', detail: 'Proceed to Follow-Up 2 on Day 5' },
      ],
      scripts: {
        'FU1 message': `Hey [Name] -- sent the proposal over 48 hours ago, wanted to make sure it came through.\n\nHad a chance to look? Happy to answer any questions or walk through it on a call.`,
      },
      metrics: { 'FU1 response rate': '30-40%' },
    },
  },
  {
    id: 'follow-up-2',
    label: 'Follow-Up 2',
    sublabel: 'Day 5 after proposal',
    stage: 'proposal',
    type: 'sequence',
    sop: {
      title: 'Follow-Up 2 -- Day 5',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Day 5 after proposal sent',
      objective: 'Add value. Don\'t just nudge -- give them a reason to respond.',
      steps: [
        { step: 'Send value-add follow-up', detail: 'Include a case study, stat, or relevant example. Not just "following up."', time: 'Day 5' },
        { step: 'Reference their specific situation', detail: '"Given what you told me about [pain], thought this was relevant."' },
        { step: 'Update GHL', detail: 'Log FU2 sent. Stage: Follow-Up 2.', tool: 'GHL' },
        { step: 'If no reply', detail: 'Proceed to Follow-Up 3 on Day 10' },
      ],
      scripts: {
        'FU2 message': `Hey [Name] -- wanted to share something relevant.\n\n[Client type] we work with was dealing with [similar pain to theirs]. We installed their AI ops layer in 3 weeks. They cut [specific metric] by [X]%.\n\nGiven what you told me about [their specific situation], thought it was worth sharing.\n\nStill happy to walk through the proposal if you want to jump on a call.`,
      },
      metrics: { 'FU2 response rate': '20-30%' },
    },
  },
  {
    id: 'follow-up-3',
    label: 'Follow-Up 3',
    sublabel: 'Day 10 -- soft close',
    stage: 'proposal',
    type: 'sequence',
    sop: {
      title: 'Follow-Up 3 -- Day 10, Soft Close',
      owner: 'Larry (Sales Agent)',
      timeframe: 'Day 10 after proposal sent',
      objective: 'Create a gentle close. Give them a clear yes/no/not-yet option.',
      steps: [
        { step: 'Send soft-close message', detail: 'Give them three options. Makes it easy to respond.', time: 'Day 10' },
        { step: 'Update GHL', detail: 'Log FU3 sent.', tool: 'GHL' },
        { step: 'If no reply after Day 10', detail: 'Move to Reactivation Sequence. GHL stage: Reactivation.', tool: 'GHL' },
      ],
      scripts: {
        'FU3 message': `Hey [Name] -- last one from me on this.\n\nWhere are you at? Three options:\n\na) Ready to move forward -- here's how to get started: [link]\nb) Interested but timing is off -- happy to check back in [X] weeks\nc) Not the right fit right now -- totally fine, just let me know\n\nEither way, appreciate the time.`,
      },
      metrics: { 'FU3 response rate': '15-25%', 'Close from FU3': '10-15%' },
    },
  },

  // ─── OBJECTION / NEGOTIATION ─────────────────────────────────
  {
    id: 'objection',
    label: 'Objection',
    sublabel: 'Price / timing / need to think',
    stage: 'negotiation',
    type: 'decision',
    sop: {
      title: 'Objection Handling',
      owner: 'Chris West + Larry',
      timeframe: 'Within 2 hours of objection received',
      objective: 'Surface the real objection. Most surface objections are proxies for something else.',
      steps: [
        { step: 'Identify objection type', detail: 'Price, timing, internal buy-in, uncertainty about ROI, competitive alternative, or just not convinced.' },
        { step: 'Acknowledge without caving', detail: 'Never immediately discount. Understand first.' },
        { step: 'Ask one diagnostic question', detail: 'Get to the real reason behind the surface objection.' },
        { step: 'Respond with the right script', detail: 'See scripts below for each objection type.' },
        { step: 'If price objection: reframe to ROI', detail: 'Calculate their current cost of NOT having this, not our cost.' },
        { step: 'If timing: set a specific follow-up date', detail: 'Don\'t leave it open. "When in [month] should I reach back out?"' },
        { step: 'Log in GHL', detail: 'Note objection type. Update stage accordingly.', tool: 'GHL' },
      ],
      scripts: {
        'Price objection': `Totally fair. Let me ask -- when you say it\'s a lot, are you comparing it to something specific, or is it more that the timing doesn\'t feel right?\n\n[After response]\n\nHere\'s how I think about it: if we can give you back 20 hours/week and close one extra deal per month, what does that math look like for [company]? We\'re usually talking $50-100K upside in the first 6 months.`,
        'Need to think': `Of course. What specifically do you want to think through? I\'d rather address it now than have you sit with a question I can probably answer in 2 minutes.`,
        'Need to talk to team': `Makes sense. What do you need from me to make that conversation easy? I can put together a one-pager for them, or jump on a 15-min call with your team directly.`,
        'Not sure about ROI': `That\'s a fair concern. Let me make it concrete. What does one wasted hour from your team cost you? And what\'s the one task you\'d automate first? Let me run the numbers for you right now.`,
        'Timing': `When does the timing look better? I\'ll mark it in my calendar and reach out then. I\'d rather give you 90 days and come back than push when it\'s not the right moment.`,
      },
      metrics: {
        'Objection to close rate': '30-40%',
        'Most common objection': 'Track in GHL to improve pitch',
      },
      bottleneckFlag: 'Objection rate above 60% on price: proposal is not establishing value clearly enough.',
    },
  },

  // ─── REACTIVATION ────────────────────────────────────────────
  {
    id: 'reactivation',
    label: 'Reactivation Campaign',
    sublabel: '30 / 60 / 90 day sequences',
    stage: 'reactivation',
    type: 'stage',
    sop: {
      title: 'Reactivation Sequence',
      owner: 'Larry (Sales Agent) + GHL',
      timeframe: 'Day 30, Day 60, Day 90 after going cold',
      objective: 'Re-engage leads who went cold without burning bridges. Timing matters.',
      steps: [
        { step: 'Day 30: Check-in', detail: 'Reference something new: a result, a product update, a relevant industry event. Not "just following up."', time: 'Day 30' },
        { step: 'Day 60: Share content', detail: 'Send something genuinely useful. A framework, a case study, a tool they\'d find valuable.', time: 'Day 60' },
        { step: 'Day 90: Direct re-open', detail: '"Has anything changed on your end? We\'re taking on 2 new installs next month -- wanted to check if the timing works better now."', time: 'Day 90' },
        { step: 'If still no response after 90 days', detail: 'Add to annual reactivation list. One touch per 6 months maximum.', time: 'Day 90+' },
        { step: 'Update GHL throughout', detail: 'Log every touch. Never send the same message twice.', tool: 'GHL' },
      ],
      scripts: {
        'Day 30': `Hey [Name] -- it\'s been a month. Wanted to share something: [relevant result/update]. Made me think of our conversation about [their pain].\n\nNo pressure -- just wanted to stay on your radar.`,
        'Day 60': `Hey [Name] -- thought you\'d find this useful: [link to relevant content/case study].\n\nNothing to sell. Just something that felt relevant to what you\'re building.`,
        'Day 90': `Hey [Name] -- checking in. Has anything changed on your end in the last few months?\n\nWe\'re opening up 2 install slots next month. If the timing is better now, happy to dust off the conversation.`,
      },
      metrics: {
        'Reactivation response rate': '10-15%',
        'Reactivation to close': '5-8%',
      },
    },
  },

  // ─── CLOSED WON ─────────────────────────────────────────────
  {
    id: 'closed-won',
    label: 'Closed Won',
    sublabel: 'Verbal yes received',
    stage: 'won',
    type: 'stage',
    sop: {
      title: 'Closed Won -- Contracting and Payment',
      owner: 'Chris West + Cleo (Ops Agent)',
      timeframe: 'Within 24 hours of verbal yes',
      objective: 'Lock in the deal before they cool off. Speed from yes to contract to payment.',
      steps: [
        { step: 'Send contract immediately', detail: 'Same day as verbal yes. Use standard Rawgrowth MSA.', tool: 'DocuSign / PandaDoc' },
        { step: 'Send invoice', detail: 'Setup fee + first month retainer. Payment link included.', tool: 'Stripe / Invoice system' },
        { step: 'Move GHL to Closed Won', detail: 'Log contract date, deal value, payment status', tool: 'GHL' },
        { step: 'Notify Cleo', detail: 'Cleo gets the new client brief: company, key contacts, start date', tool: 'Mission task to Cleo' },
        { step: 'Send welcome message', detail: '"Welcome to the team." Warm, human. Not corporate.', time: 'Same day' },
        { step: 'Wait for payment confirmation', detail: 'Stripe webhook fires to GHL when paid. Stage: Payment Received.' },
        { step: 'Trigger portal invite', detail: 'Send portal invite to client email automatically or manually', tool: 'portal.rawgrowth.ai' },
      ],
      scripts: {
        'Post-verbal yes': `Let\'s lock it in. I\'ll send the contract and invoice now -- usually takes 5 minutes to sign. Once that\'s done we\'ll get you into the portal and start planning the install.\n\nExcited to build this with you.`,
        'Welcome message': `Hey [Name] -- welcome. Really glad we\'re doing this.\n\nYou\'ll get a portal invite in the next few minutes. First step there is a short brand intake questionnaire -- takes about 20 minutes and gives our agents everything they need to start working.\n\nCleo from our team will reach out to schedule your kick-off call. Any questions between now and then, hit me directly.`,
      },
      metrics: {
        'Yes to contract signed': 'Under 48 hours',
        'Contract to payment': 'Under 72 hours',
      },
      bottleneckFlag: 'Contract sitting unsigned for 72h+ means buyer\'s remorse is setting in. Get on a call.',
    },
  },

  // ─── PORTAL ONBOARDING ───────────────────────────────────────
  {
    id: 'portal-invite',
    label: 'Portal Invite Sent',
    sublabel: 'portal.rawgrowth.ai',
    stage: 'onboarding',
    type: 'action',
    sop: {
      title: 'Portal Access and Invite',
      owner: 'Cleo (Ops Agent)',
      timeframe: 'Within 2 hours of payment confirmed',
      objective: 'Get the client into the portal and moving through onboarding before the excitement fades.',
      steps: [
        { step: 'Generate portal invite code', detail: 'Admin panel → Invites → Generate. Label with client name.', tool: 'portal.rawgrowth.ai/admin/invites' },
        { step: 'Send invite email', detail: 'Include the invite code, portal URL, and 2-sentence explainer on what to do first.' },
        { step: 'Set 24h follow-up', detail: 'If they haven\'t created their account in 24h, send a nudge.' },
        { step: 'Create client folder', detail: 'Create clients/[name]/ in the BusinessOS repo. Add profile.md from template.', tool: 'BusinessOS repo' },
        { step: 'Create GHL task', detail: 'Cleo monitors onboarding step completion via portal dashboard.', tool: 'GHL + portal' },
      ],
      scripts: {
        'Invite email': `Hey [Name],\n\nYour portal is ready. Here's your invite code: [CODE]\n\nGo here to create your account: portal.rawgrowth.ai\n\nFirst thing to do once you're in: complete the brand intake questionnaire. It takes 20 minutes and tells our agents everything they need to know about your business. The better you fill it out, the better your AI department performs from day one.\n\nI'll check in once you're through it.\n\nCleo`,
      },
      metrics: {
        'Invite to account creation': 'Under 48 hours',
        'Account to intake completion': 'Under 5 days',
      },
      bottleneckFlag: 'Intake not completed in 5 days: proactive nudge from Cleo required. This is the #1 onboarding bottleneck.',
    },
  },
  {
    id: 'brand-intake',
    label: 'Brand Intake',
    sublabel: '13-section questionnaire',
    stage: 'onboarding',
    type: 'action',
    sop: {
      title: 'Brand Intake Questionnaire',
      owner: 'Client (self-serve) + Cleo',
      timeframe: '20-30 min for client to complete',
      objective: 'Capture everything agents need to work autonomously for this client: voice, ICP, offer, team, tools, competitors.',
      steps: [
        { step: 'Client completes 13 sections', detail: 'Basic info, social presence, origin story, business model, target audience, goals, challenges, brand voice, competitors, content/messaging, sales, tools/systems, additional context', tool: 'portal.rawgrowth.ai/onboarding' },
        { step: 'Cleo monitors completion', detail: 'Portal dashboard shows % complete. Flag if stuck on any section.' },
        { step: 'Intake submitted', detail: 'Triggers AI brand profile generation automatically', tool: 'Portal + Anthropic API' },
        { step: 'Cleo reviews intake', detail: 'Check for gaps. If any critical section empty, reach out to fill it.' },
      ],
      metrics: {
        'Avg completion time': '25 min',
        'Completion rate without nudge': '70%',
        'Completion rate with nudge': '95%+',
      },
      bottleneckFlag: 'Sections most often skipped: Competitors, Sales process, Brand Voice. Cleo should pre-fill from call notes where possible.',
    },
  },
  {
    id: 'brand-profile',
    label: 'AI Brand Profile Generated',
    sublabel: 'Claude generates from intake',
    stage: 'onboarding',
    type: 'action',
    sop: {
      title: 'Brand Profile Generation and Review',
      owner: 'Portal AI + Cleo',
      timeframe: '5 minutes auto-generation, 30 min Cleo review',
      objective: 'Produce a brand profile document that agents can use as their primary context file.',
      steps: [
        { step: 'Auto-generation triggers on intake submit', detail: 'Claude Sonnet reads all 13 intake sections and generates structured brand profile markdown', tool: 'Portal API + Claude' },
        { step: 'Cleo reviews generated profile', detail: 'Check: Is the ICP accurate? Does the voice match the call notes? Is the offer description correct?' },
        { step: 'Admin approves or requests regeneration', detail: 'Portal admin panel → Brand Profile → Approve / Regenerate with feedback', tool: 'portal.rawgrowth.ai/admin' },
        { step: 'Profile pushed to Rawclaw knowledge base', detail: 'Via portal-sync or manual export to knowledge/client/business.md', tool: 'portal-sync + Rawclaw' },
      ],
      metrics: {
        'Profile accuracy (Cleo rating)': '4+ / 5 target',
        'Regeneration rate': 'Under 20%',
      },
    },
  },

  // ─── RAWCLAW SETUP ────────────────────────────────────────────
  {
    id: 'rawclaw-install',
    label: 'Rawclaw Install',
    sublabel: 'Mac Mini / VPS setup',
    stage: 'setup',
    type: 'stage',
    sop: {
      title: 'Rawclaw Install SOP',
      owner: 'Ali (Dev Agent)',
      timeframe: '2-4 hours on-site or remote',
      objective: 'Get the client\'s Rawclaw instance running, connected to their data, and fully tested before handoff.',
      steps: [
        { step: 'Provision hardware', detail: 'Mac Mini M4 (~$600) for on-site. VPS (Hetzner CX32 ~$12/mo) for remote installs.', tool: 'Hardware / Hetzner' },
        { step: 'Clone Rawclaw v3', detail: 'git clone github.com/scanbott/rawclaw', tool: 'Git' },
        { step: 'Run setup wizard', detail: 'npm run setup -- follows interactive prompts for all config', tool: 'Rawclaw CLI' },
        { step: 'Set PORTAL_TOKEN in .env', detail: 'Paste client\'s Convex ID from portal admin. Run npm run portal-sync to pull their data.', tool: 'portal.rawgrowth.ai' },
        { step: 'Configure agent Telegram bots', detail: 'Create bots via @BotFather. One per agent role. Add tokens to agent.yaml files.' },
        { step: 'Run health check', detail: 'npm run status -- confirms all agents, DB, and channels are live' },
        { step: 'Test first message', detail: 'Send test message to each agent. Confirm knowledge base loaded correctly.' },
        { step: 'Install as background service', detail: 'npm run agent:start -- runs as launchd (Mac) or systemd (Linux) service. Survives reboots.' },
      ],
      metrics: {
        'Install time target': 'Under 4 hours',
        'Time to first agent response': 'Under 10 min after go-live',
      },
      bottleneckFlag: 'Install taking 4h+: document blockers and add to setup wizard troubleshooting guide.',
    },
  },
  {
    id: 'portal-sync-step',
    label: 'Portal Sync',
    sublabel: 'npm run portal-sync',
    stage: 'setup',
    type: 'action',
    sop: {
      title: 'Portal Sync -- Connecting Portal to Rawclaw',
      owner: 'Ali (Dev Agent)',
      timeframe: '5 minutes, then runs daily via cron',
      objective: 'Pull all client data from the portal into Rawclaw knowledge files automatically. This is the bridge between the portal and the agents.',
      steps: [
        { step: 'Set PORTAL_TOKEN in .env', detail: 'Token = client\'s Convex _id from portal.rawgrowth.ai/admin', tool: 'portal.rawgrowth.ai/admin' },
        { step: 'Run: npm run portal-sync', detail: 'Hits GET /api/client-export. Writes to knowledge/client/', tool: 'Rawclaw CLI' },
        { step: 'Verify knowledge files created', detail: 'Check: knowledge/client/business.md, brand-voice.md, team.md', tool: 'File system' },
        { step: 'Schedule daily sync', detail: 'node dist/schedule-cli.js create "npm run portal-sync" "0 3 * * *"', tool: 'Rawclaw scheduler' },
        { step: 'Test: ask any agent about the client', detail: '"What do you know about this company?" -- should return accurate brand info' },
      ],
      scripts: {
        'Portal sync command': 'PORTAL_TOKEN=<clientId> npm run portal-sync',
        'Schedule daily': 'node dist/schedule-cli.js create "npm run portal-sync" "0 3 * * *"',
      },
      metrics: {
        'Sync success rate': '99%+',
        'Knowledge file accuracy': 'Verified by Ali on install',
      },
    },
  },
  {
    id: 'agent-config',
    label: 'Agent Configuration',
    sublabel: '9 roles configured',
    stage: 'setup',
    type: 'action',
    sop: {
      title: 'Agent Role Configuration',
      owner: 'Ali (Dev Agent) + Client',
      timeframe: '1-2 hours during install',
      objective: 'Configure each agent role with the right CLAUDE.md, tools, and Telegram bot.',
      steps: [
        { step: 'Choose which agents to activate', detail: 'Not all 9 roles are needed for every client. Start with: main, ops, research, content. Add others as needed.' },
        { step: 'Configure each agent CLAUDE.md', detail: 'Copy from CLAUDE.md.example. Fill in client-specific context. Load knowledge files.', tool: 'agents/[role]/CLAUDE.md' },
        { step: 'Create Telegram bots', detail: 'One per active agent. @BotFather → /newbot. Save tokens.', tool: 'Telegram @BotFather' },
        { step: 'Set agent.yaml for each', detail: 'Name, model, channel, bot token, agent ID', tool: 'agents/[role]/agent.yaml' },
        { step: 'Test each agent individually', detail: 'Send a test message. Confirm it loads knowledge base and responds correctly.' },
        { step: 'Brief client on how to use each agent', detail: '15-min walkthrough: what each agent does, how to message them, what they can and can\'t do.' },
      ],
      metrics: {
        'Active agents on install': '4-6 typically',
        'All agents responding': 'Verified before handoff',
      },
    },
  },
  {
    id: 'go-live',
    label: 'Go Live',
    sublabel: 'Client using system',
    stage: 'setup',
    type: 'stage',
    sop: {
      title: 'Go-Live Checklist',
      owner: 'Ali (Dev Agent) + Cleo (Ops Agent)',
      timeframe: 'End of install day',
      objective: 'Confirm everything works before walking away. No half-deployed installs.',
      steps: [
        { step: 'Run ship check', detail: 'Load ship-check skill. Every agent responds. Knowledge base loaded. Hive mind working. Scheduler running.', tool: 'ship-check skill' },
        { step: 'Client sends first real message', detail: 'Not a test. An actual task. Watch the response. Fix anything that\'s off.' },
        { step: 'Schedule kick-off call', detail: 'Cleo schedules 60-min kick-off call for Day 3-5. Goes through what each agent can do.', tool: 'Calendly' },
        { step: 'Send go-live confirmation to client', detail: 'Email: "Your AI department is live." Include agent contact info and what to use each one for.' },
        { step: 'Log to hive mind', detail: 'Record go-live date, client ID, agents activated, any custom config notes', tool: 'SQLite hive_mind' },
        { step: 'Set Month 1 check-in reminder', detail: '30-day health check. Cleo reminder.', tool: 'GHL' },
      ],
      metrics: {
        'Go-live same day as install': '90%+ target',
        'Client sends first task same day': '80%+ target',
      },
    },
  },

  // ─── FULFILLMENT ─────────────────────────────────────────────
  {
    id: 'month-1',
    label: 'Month 1: Foundation',
    sublabel: 'Onboarding and first wins',
    stage: 'fulfillment',
    type: 'stage',
    sop: {
      title: 'Month 1 Fulfillment -- Foundation',
      owner: 'Cleo (Ops Agent)',
      timeframe: 'Days 1-30',
      objective: 'Get the client to their first tangible AI win within 14 days. Prove ROI early.',
      steps: [
        { step: 'Week 1: Kick-off call', detail: '60-min session. Map every repeatable task to an agent. Prioritize top 3 automations.', tool: 'Cleo + Chris' },
        { step: 'Week 1-2: First automation live', detail: 'Pick the easiest, highest-impact task. Get it running. Document the time saved.' },
        { step: 'Week 2: Agent training session', detail: '30-min call with client team. Show them how to use each agent effectively.' },
        { step: 'Week 3: Expand scope', detail: 'Roll out second and third automation. Add agents as needed.' },
        { step: 'Week 4: Month 1 review call', detail: 'Cleo presents: tasks automated, hours saved, $ impact estimate. Plan Month 2.' },
        { step: 'Month 1 report', detail: 'Cleo generates and sends monthly ROI report.', tool: 'Cleo + portal' },
      ],
      metrics: {
        'First win timeline': 'Under 14 days',
        'Avg hours saved Month 1': '15-25 hrs/week',
        'NPS at Day 30': '8+ target',
      },
      bottleneckFlag: 'No win in 14 days: escalate to Chris. Client is not activating agents. Hands-on session needed.',
    },
  },
  {
    id: 'ongoing',
    label: 'Ongoing Retainer',
    sublabel: '$10K/mo, optimize and scale',
    stage: 'fulfillment',
    type: 'stage',
    sop: {
      title: 'Ongoing Fulfillment -- Month 2+',
      owner: 'Cleo + All Agents',
      timeframe: 'Monthly cycle',
      objective: 'Continuously expand AI coverage. Prevent churn by proving ROI every month.',
      steps: [
        { step: 'Monthly health check', detail: 'Cleo reviews: agent usage frequency, tasks completed, errors, client satisfaction', tool: 'Rawclaw hive_mind + portal' },
        { step: 'Monthly ROI report', detail: 'Hours saved, tasks automated, revenue impact (if trackable). Sent by Day 5 of each month.', tool: 'Cleo + Sam (Finance Agent)' },
        { step: 'Monthly check-in call', detail: '30-min with client. What\'s working? What\'s next? Any blockers?', tool: 'Calendly (scheduled via portal)' },
        { step: 'Expansion opportunities', detail: 'Identify new workflows to automate each month. Client should feel like the system is getting smarter.' },
        { step: 'Skills updates', detail: 'Ali pushes new Rawclaw skills and updates as released. Portal-sync keeps knowledge current.', tool: 'Rawclaw + portal-sync' },
        { step: 'Renewal / expansion conversation', detail: 'Month 3+: look for expansion opportunities (more agents, more tools, team training).', tool: 'Larry (Sales Agent)' },
      ],
      metrics: {
        'Churn rate target': 'Under 5%/mo',
        'Avg client lifespan': '12+ months',
        'Expansion rate': '30% of clients expand in Month 3-6',
      },
      bottleneckFlag: 'Churn risk signals: no login in 14 days, no tasks sent to agents, dropped off check-in calls.',
    },
  },
];

// ─── FLOW EDGES ───────────────────────────────────────────────────────────────
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: 'success' | 'fail' | 'default';
}

export const FLOW_EDGES: FlowEdge[] = [
  { id: 'e1', source: 'prospect', target: 'dm-outreach' },
  { id: 'e2', source: 'dm-outreach', target: 'no-reply', label: 'No reply 48h' },
  { id: 'e3', source: 'dm-outreach', target: 'interested', label: 'Replied' },
  { id: 'e4', source: 'no-reply', target: 'interested', label: 'Recovered' },
  { id: 'e5', source: 'interested', target: 'call-booked' },
  { id: 'e6', source: 'call-booked', target: 'no-show', label: 'No-show' },
  { id: 'e7', source: 'call-booked', target: 'discovery-call', label: 'Shows up' },
  { id: 'e8', source: 'no-show', target: 'discovery-call', label: 'Rescheduled' },
  { id: 'e9', source: 'no-show', target: 'reactivation', label: 'Ghosted' },
  { id: 'e10', source: 'discovery-call', target: 'call-scored' },
  { id: 'e11', source: 'call-scored', target: 'proposal-sent', label: 'Score 4-5' },
  { id: 'e12', source: 'call-scored', target: 'reactivation', label: 'Score 1-2' },
  { id: 'e13', source: 'proposal-sent', target: 'follow-up-1', label: 'No response 48h' },
  { id: 'e14', source: 'proposal-sent', target: 'objection', label: 'Objection' },
  { id: 'e15', source: 'proposal-sent', target: 'closed-won', label: 'Yes', animated: true },
  { id: 'e16', source: 'follow-up-1', target: 'follow-up-2', label: 'No reply' },
  { id: 'e17', source: 'follow-up-1', target: 'objection', label: 'Objection' },
  { id: 'e18', source: 'follow-up-1', target: 'closed-won', label: 'Yes', animated: true },
  { id: 'e19', source: 'follow-up-2', target: 'follow-up-3', label: 'No reply' },
  { id: 'e20', source: 'follow-up-2', target: 'closed-won', label: 'Yes', animated: true },
  { id: 'e21', source: 'follow-up-3', target: 'reactivation', label: 'No reply' },
  { id: 'e22', source: 'follow-up-3', target: 'closed-won', label: 'Yes', animated: true },
  { id: 'e23', source: 'objection', target: 'closed-won', label: 'Resolved', animated: true },
  { id: 'e24', source: 'objection', target: 'follow-up-2', label: 'Timing' },
  { id: 'e25', source: 'reactivation', target: 'call-booked', label: 'Re-engaged', animated: true },
  { id: 'e26', source: 'closed-won', target: 'portal-invite' },
  { id: 'e27', source: 'portal-invite', target: 'brand-intake' },
  { id: 'e28', source: 'brand-intake', target: 'brand-profile' },
  { id: 'e29', source: 'brand-profile', target: 'rawclaw-install' },
  { id: 'e30', source: 'rawclaw-install', target: 'portal-sync-step' },
  { id: 'e31', source: 'portal-sync-step', target: 'agent-config' },
  { id: 'e32', source: 'agent-config', target: 'go-live' },
  { id: 'e33', source: 'go-live', target: 'month-1' },
  { id: 'e34', source: 'month-1', target: 'ongoing' },
];
