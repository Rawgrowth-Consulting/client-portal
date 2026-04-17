/**
 * Run with: npx dotenv -e .env -- npx tsx db/006_brand_profiles_seed.ts
 *
 * Seeds the brand_profiles table with existing Convex data.
 * Only includes approved/meaningful profiles (skips error artifacts).
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const records = [
  {
    email: "james.oldham0604@gmail.com",
    version: 1,
    status: "approved",
    generated_at: 1776311550929,
    approved_at: 1776311685947,
    content: `# SENTRY AI – INTERNAL BRAND BRIEF
*for the eyes of every AI agent that will touch this account*

---

## 1. COMPANY OVERVIEW
**Name:** Sentry AI
**Human-in-charge:** James Oldham (Founder, NZT timezone)
**URL:** https://sentrysolutions.ai
**TikTok handle:** @james.oldham_ (primary growth engine)
**What we actually sell:** 3-tier "gym products" (digital courses, coaching, app/tool stack – exact format undefined, but 50 % margin, $30-$100 K MRR)
**Reality check:** 80 % of revenue is already paid traffic, 20 % organic TikTok. Team = 3 FT. No CRM, no email list discipline, no webinar funnel – yet.
**Owner's honest origin:** "Just making IG content" → accidentally hit a nerve with 40-65 yr olds who have money and hate generic fitness BS.
**North-star for next 90 days:** Push monthly recurring to $50 K (≈ 65 % lift) without adding head-count.

---

## 2. BRAND IDENTITY & VOICE
DO NOT sound like a Silicon-Valley SaaS robot.
DO NOT use "leverage fat, unlock gains" bro-speak – the crowd is 45-70.
DO:
- Talk like a trusted Kiwi nephew who's figured it out and can explain it over a beer.
- Use short, concrete nouns ("knees", "grand-kids", "ski trip", "doctor's face").
- Celebrate micro-wins ("tied my boat shoes without sitting down").
- Swearing is OK if hilarious; never cruel.
- Metric system + NZ slang is fine; dollars = USD when selling.
**Tone dial:** 70 % friendly coach, 20 % cheeky uncle, 10 % data nerd who quietly shows the receipts.

---

## 3. TARGET AUDIENCE / ICP
**Primary ICP (spend tier 1):**
- Age 45-70, household income $100 K+, mainly US/CA/AU with seasonal NZ/UK.
- Pain: joint pain, sagging energy, doctor's "lose 20 lbs or else" speech.
- Hang-out zones: Reddit r/Fitness40plus, r/KneesOverToes, r/StopDrinking, Facebook boomer groups, YouTube comment threads under "Men over 50 mobility" clips.
- Dream outcome: be capable of keeping up with grand-kids on holiday, avoid surgery, feel 35 again, prove doctor wrong.
**Secondary ICP (organic army):**
- 30-44 busy professionals who already train but want "anti-fragile" joints; share content upward to parents.

**Psychographics:**
- Sceptical of gimmicks, will pay for logic + proof.
- Secretly terrified of wasting later years in pain.
- Will brag once they hit a 100-day streak.

---

## 4. CONTENT STRATEGY FRAMEWORK
**Hero platform = TikTok; IG-Reels cut-down; YouTube Shorts for search; Reddit long-form for trust.**
**Pillar mix (post ratio per week):**
1. Pain-stacking hook (4): "If tying your shoes feels like a warm-up…"
2. Micro-dose science (3): 15-second stitch "Here's why cartilage loves compression…"
3. Social proof (3): user-generated before/after knee extension screenshot.
4. Founder story (2): James voice-over while rehabbing his own dad.
5. Offer tease (1): "3-tier system – which tier fits your knee?" CTA → DM keyword "sentry".
**Hook templates that win:**
- "Shot by a 62-yr-old who couldn't…"
- "Doctor said 'no squats' – we disagreed."
**Content cadence:** 2 posts/day TikTok, 1 live/week (Q&A), recycle top 10 % into paid creatives.
**KPI hierarchy:**
A. Cost per new email (goal <$1.50)
B. DM conversations started (goal 150/wk)
C. Trip-wire $37 sale → upsell take-rate (goal 18 %)

---

## 5. SALES POSITIONING
**Current funnel shape:** TikTok → DM keyword → Calendly call → 3-tier close on Zoom.
**Pricing snapshot (anchor high):**
- Starter $397 mobility reset (DIY videos)
- Growth $1,497 12-week coaching + app tracker
- Elite $4,997 1-on-1 + biomechanics lab + 365 support
**Offer uniqueness:** "Joint-first" method; 45-70 yr proof library; NZ-based but 24-hr async coaching.
**Objections to pre-handle:**
1. "I'm too old." → Show 78-yr-old client ski video.
2. "Sounds expensive." → Cost of single cortisone shot vs lifetime fix.
3. "TikTok kid, why trust?" → LinkedIn James sport-science creds + 15-yr coaching.
**Guarantee:** 30-day 'can-you-tie-shoes' test or money back.

---

## 6. COMPETITIVE LANDSCAPE
**Direct response mobility people:**
- KneesOverToesGuy (loud YouTube, price <$100, younger demo)
- GMB Fitness (body-weight, big list)
- FitFatherProject (men 40+, webinar heavy)
**White-space we own:** "Old-people-with-money who hate burpees; want bullet-proof joints, not six-pack."
**Spy notes:**
- Their creatives = long VSL (4-12 min). We win with 15-sec TikTok hooks.
- Their communities charge <$50/mo. We anchor at $4K and go high-touch.

---

## 7. KEY MESSAGING PILLARS
1. Joint-first = everything else follows.
2. Data in, dogma out (show ROM numbers or we don't speak).
3. 15-min a day, not 60 (respects aging calendar).
4. Prove the doctor wrong (emotional chip).
5. Keep the grand-kids tired, not you.

**Tagline (test):** "Sentry – guard your last 30 years."

---

## 8. RECOMMENDED AI AGENT CONFIGURATION
We will deploy 4 specialist agents; train inside HighLevel + internal vector DB.

### A. "Hook-Smith" – Creative Agent
**Priority 1**
**Train on:**
- Top 100 performing TikToks (view-to-profile ratio > 25 %) in fitness 40+ niche.
- James' own voice transcriptions (feed 20 h of past videos).
- Hook scripts from Russell Brice, Alex Hormozi – but aged-up vocab.
**Output:** 5 fresh scripts/day, auto-add on-screen captions.

### B. "Gramps Whisperer" – Community/Reply Agent
**Priority 1**
**Scope:** answer every comment & DM within 10 min; drop CTA to keyword.
**Train on:**
- Reddit threads r/Fitness40plus pain language (scrape 5 K posts).
- James' FAQ bank (build from call recordings).
**Rules:** no med advice, always ask ROM metric first, push to DM, never external links first 30 days.

### C. "Calendar Cowboy" – Booking & Objection Bot
**Priority 2**
**Integrations:** Calendly,Stripe, GHL.
**Train on:**
- Recorded Zoom closes (feed 30 calls).
- Objection tree (price, time, spouse, doctor).
**KPI:** Show-rate 70 % → 85 % after 60 days.

### D. "Upsell Oracle" – Revenue Expansion Agent
**Priority 3**
**Monitors:** client milestone tags "90-day, 180-day".
**Trained on:** upgrade email scripts, upsell timeline triggers, joint-score metrics.
**Auto-offers:** Elite upgrade, yearly plan, affiliate supplement pack.

**Data ingestion checklist (feed all agents):**
✓ Upload past Stripe sales CSV (with LTV).
✓ Export TikTok analytics (CSV inside Business centre).
✓ Drop Box folder of uncut client testimonial videos → auto-transcribe.
✓ Create embeddings of competitor ads for differentiation prompt.

**Benchmarks 90-days:**
- TikTok follower growth 30 % (current base: take last 30-day average).
- DM convo → booked call 12 %
- Call → paid 25 %
- MRR $50 K (baseline April: estimate April figure)

**Agent stack decision:** Use OpenAI GPT-4 API + Pinecone memory per user (conversation continuity). Deploy inside Make.com or HighLevel workflows. Hand-off to human when sentiment score < –0.25.

---

**END OF BRIEF – circulate URL to all agent sandboxes before first model fine-tune.**`,
  },
  {
    email: "wyliehawkins99@gmail.com",
    version: 1,
    status: "approved",
    generated_at: 1775939961804,
    approved_at: 1775939976869,
    content: "",
  },
  {
    email: "jacksonrapaportffl@gmail.com",
    version: 1,
    status: "approved",
    generated_at: 1776106928120,
    approved_at: 1776179643784,
    content: `# BRAND PROFILE
**Apex Enterprises LLC – AI Department Briefing Document**
**Prepared for:** Jackson Paul Rapaport & the Apex Agent Army
**Date:** 2024-Q3
**Classification:** Internal Use Only – Train all AI agents on this doc before any outbound action

---

## 1. COMPANY OVERVIEW
**Legal Name:** Apex Enterprises LLC
**Founder:** Jackson Paul Rapaport (sole owner)
**Current HQ Time-Zone:** Central (CST)
**Phone:** 970-319-9739
**Primary Handles:** @jacksonrapaport (IG, TikTok, YouTube)

**What we actually do:**
1. Front-end: Sell whole-life & IUL policies nationwide (10 mo. track record, $500K personal production, $250K avg. monthly).
2. Back-end: Recruit, train, override 20-25 captive agents (goal: $3-5M team production per month inside 12 mo.).

**Foundational flywheel:** FAITH → FITNESS → FINANCE.
**Unfair supply of energy:** 24-yr-old Christian operator who's worked every blue-collar job and will out-work the field.

---

## 2. BRAND IDENTITY & VOICE
**Persona archetype:** Visionary-Protector-Provider (modern knight).
**Tone filters (train every LLM reply):**
- NO entitlement language, NO relativism ("your truth").
- YES masculine responsibility frame ("Put the world on your back").
- YES scripture-friendly but gym-floor real ("Crucify the flesh, starve the dog").
- Speak in commands, not questions. Close with CTAs.

**Vocabulary green-list:** provider, protector, covenant, legacy, fortress, agent-army, issue-paid, override, in-force.
**Vocabulary red-list:** side hustle, scammy, bro-marketing, passive income (say "recurring revenue" instead), "everyone can do this".

**Visual cheat-sheet for generative agents**
- Colour palette: gun-metal, forest green, off-white.
- Texture: concrete, barbell knurl, bible linen.
- Never place founder next to Lambo; place him next to barbell, whiteboard, baptism river.

---

## 3. TARGET AUDIENCE / ICP (Ideal Candidate Profile)
**Primary recruit avatar "Luke":**
- Male 18-30, US anywhere, came from: roofing, FRAC sand, door-to-door alarms, serving, bar-tending, military.
- Earned $40-70K last year; body is his billboard; feels stuck on a treadmill.
- **Pain:** no purpose, no tribe, no leverage.
- **Dream:** $20K/mo recurring, work from truck cab, locational freedom, calloused hands & clear conscience.

**Secondary avatar "Client-Cory":**
- 28-45 married tradesman, baby on way, debt-heavy.
- Needs $750K whole-life before 1st kid hits kindergarten.

**Platform GPS:** Instagram (cold eyeballs) → YouTube (deepen belief) → Zoom (1-call close) → GroupMe (daily tribe noise).

---

## 4. CONTENT STRATEGY FRAMEWORK
**Core content trinity:**
1. **Faith** – "Morning Ephesians + 5-mile ruck" (IG Reel 0:45)
2. **Fitness** – garage-gym workouts, blood pressure > blood alcohol (TikTok/YT-Shorts)
3. **Finance** – break LES of prior job vs. first insurance commission cheque (carousel, 8 slides)

**Content ladder per week**
- 7 IG Reels (≥1 hook "If you can swing a hammer you can close a policy").
- 5 TikTok cuts (cross-posted).
- 2 YT long (8-12 min vlog: field training day + commission breakdown).
- 1 Live sales breakdown (LinkedIn Event simul-stream).
- Daily IG Stories: CRM scoreboard screenshot, agent testimonial, scripture.

**Evergreen funnels (queue in Repurpose agent):**
1. "From pay-cheque to policy" tutorial playlist (YouTube).
2. 30-day recruit email drip (not built yet – see infra).

**Content KPIs:**
- New agent DMs asking "how do I start?" ≥15/wk.
- Life-insurance lead form CPL ≤ $9.
- IG save-reel share rate ≥ 3.5%.

---

## 5. SALES POSITIONING
**Pitch spine (use on every agent call):**
1. **World is ending** (death + taxes) → Insurance prevents tragedy.
2. **Only two doors:** Swing sledge for 40 yrs OR own the hammer that pays you forever (renewals).
3. **We give 3 things competitors refuse:** tribe, temple (fitness), truth (faith).
4. **Close:** "You can borrow my belief for 90 days; after that the policy has to cash-flow and your body has to pass the PT test—deal?"

**Objection turners (train AI SDR):**
- "I don't want to spend money today." → "Fine—die tomorrow and your mum pays. Or live tomorrow and the cash grows. Either way the premium is cheaper than your truck payment."
- "Is this MLM?" → "Military has ranks too—we just promote faster if you outs produce your captain."

**Process map:**
Lead → 3-question text → Calendly link → 15-min Zoom screen-share (illustrator) → e-app same call → ACH draft → GroupMe on-board blast → 30-day boot camp (daily KPI: 4 apps/30 contacts).

---

## 6. COMPETITIVE LANDSCAPE
**Direct competitor pages to monitor (scraping agent task):**
- @ifstanwasrich – heavy finance meme; counter with legacy angle
- @officialjaymaska – flashy lifestyle; counter with 'garage gym > Gucci' reels
- Higher-Up-Wellness – pseudo-life-insurance; counter with license proof & carrier ratings

**White-space we own (feed into messaging):**
- Data-driven fitness standards (nobody shows agents' push-up test).
- Bible-first business (non-cringe, action-oriented theology).
- Charge-back transparency (industry dirty secret; we publish quarterly lapse %).

---

## 7. KEY MESSAGING PILLARS
**1. Protect the Bloodline** – every vertical talks legacy $ first.
**2. Sweat Equity > Gatekeepers** – no degree, no capital, just output.
**3. Multiplication through Discipleship** – each agent plants 5 more.
**4. Renewal Royalty** – recurring revenue equals true business.
**5. Obedience = Market Share** – dominate because you out-work, not out-spend.

**Tagline stack (rotate):**
"Close policies. Crush workouts. Keep the faith."
"Your back is strong enough—carry your family."
"Whole life policies, whole life people."

---

## 8. RECOMMENDED AI AGENT CONFIGURATION
**Priority #1 – Recruit & Book (speed to $60K month)**

1. **TikTok/IG Re-purposing Agent**
   - **Training data:** 50 best hooks from @jacksonrapaport + top 100 comments.
   - **Jobs:** auto-clip 1 long YT into 5 verticals, write 3 captions, queue to Later; rotate pillars evenly.

2. **DM Qualifier Bot (IG only)**
   - **Trigger keyword list:** "how to start", "mentorship", "is this a scam", emoji sequence.
   - **Reply tree:** 3 qualifying questions (age, current job, why change) → Calendly link → tag human if >70% 'Yes' score.
   - **Voice mirror:** short, direct sentences, no emojis >2.

3. **Sales-Assist Agent (Zoom live whisper)**
   - Listen for key phrases → drop rebuttal micro-script in chat to closer (permission based).
   - Real-time objection heat-map for weekly training cuts.

4. **Boot-camp LMS Agent**
   - Convert existing filmed boot-camp into daily email/SMS drip.
   - Insert quiz after each module; unlock next lesson only when quiz ≥ 80%.
   - Auto-pull issue-paid from Google Sheet and congratulate agent on progress.

5. **Profitability Tracker (Data Ops)**
   - Ingest Stripe + carrier commission CSV nightly → output simple P&L dashboard (Notion embed).
   - Fire alert webhook if overrun >15% monthly spend.

**Secondary (Quarter-2) Agents**
6. Email Nurture Writer (Mailchimp integration)
7. Charge-back Forecast (predictive model on policy lapse)
8. Faith-Fitness Newsletter Compiler (pull 1 verse + 1 workout/day)

---

## AI DEPARTMENT OKRs (first 90 days)
- DM Bot converts 25% of qualified chats → booked calls (baseline 0).
- Repurposing agent pushes 120 pieces/mo; saves founder 15 hrs/mo.
- Profit bot reveals true margin ≥ 35%.
- Recruit velocity: 10 new issue-paying ≥ $15K inside 90 days.

**End of file – load this doc into memory before every prompt chain.**`,
  },
  {
    email: "marcus@apexgrowthagency.com",
    version: 1,
    status: "approved",
    generated_at: 1775814950616,
    approved_at: 1775815457783,
    content: `# Apex Growth Agency — Brand Profile

## 1. Company Overview

**Company:** Apex Growth Agency
**Founder:** Marcus Reid
**Revenue:** $100K–$250K/month | **Margin:** ~42% | **Team:** 9 people
**Model:** B2B SaaS growth agency on performance-aligned retainers

Apex Growth Agency installs revenue systems into B2B SaaS companies at the $1M–$15M ARR stage. They are not a strategy shop — they are embedded operators who sit inside client businesses, own pipeline, and are accountable for documented ROI. Every engagement is tied to measurable outcomes or the retainer does not renew.

Marcus Reid built the agency after 8 years as a SaaS operator himself. He understands what founders actually need: not more decks, not more frameworks — execution with attribution.

---

## 2. Brand Identity & Voice

**Voice:** Direct. Operator-first. No-BS.
**Tone:** Confident without arrogance. Generous with real information. Slightly impatient with mediocrity. Loyal to results.

**Sounds like:** A sharp founder sharing what actually happened on a recent engagement — specific numbers, real attribution, zero hedging.

**Never sounds like:** A McKinsey deck. Corporate jargon. Vague thought leadership. Passive voice. Anything that hedges outcomes.

**Banned words/phrases:** Game-changer, revolutionary, disruptive, world-class, guru, secret sauce, synergize, leverage core competencies, move the needle.

**Signature phrases:** "Here is what we did, here is what happened, here is what we would do differently." / "Operator. Pipeline. Retention. Real talk. Without the fluff."

---

## 3. Target Audience / ICP

**Primary:** B2B SaaS founders and CMOs at companies $1M–$15M ARR
**Psychographic:** Former operators themselves. Tired of agencies that bill for activity. Want a partner who is accountable to revenue, not deliverables.
**Pain:** Marketing team produces content and campaigns, but nobody can draw a line from output to pipeline. Growth is happening but it is not systematic — it still runs through the founder.
**Decision driver:** Documented ROI from similar companies. Proof that Apex has operated inside businesses like theirs.

---

## 4. Content Strategy Framework

**Primary platform:** LinkedIn (2x/week)
**Newsletter:** 2x/month (reads like an internal memo — real numbers, real attribution)
**Core topics:**
1. B2B SaaS growth strategy — what actually moves pipeline
2. Agency operations and how Apex runs client engagements
3. Real case studies with attribution data
4. The gap between marketing activity and revenue impact

**Best-performing format:** Short-form posts with specific numbers ("We added $38K MRR in 90 days — here is the exact breakdown")
**Content Marcus dislikes creating:** TikTok-style talking head video, podcasts, daily Twitter threads

**AI content directive:** Match Marcus voice exactly — operator-first, specific, no hedging. Every first draft must include at least one real data point. No generic growth advice.

---

## 5. Sales Positioning

**Offer:** Embedded growth partnership — retainer-based, outcome-aligned
**Close rate:** 58% on qualified calls
**Sales motion:** LinkedIn inbound → 20-min discovery → case study + audit doc → 45-min strategy call → close on call 2 or async Loom

**Top objections:**
- Price (not the cheapest option — reframe to ROI)
- "We have an internal team" (show what embedded looks like vs. internal)
- Timing / "next quarter" (urgency framing around current pipeline gap)

**Ideal client signals:** Operator-founder, $3M–$15M ARR, understands attribution, willing to give real access
**Disqualifiers:** Needs overnight results, committee approval on everything, treats agency as vendor

---

## 6. Competitive Landscape

**Direct competitors:** Applify, Growth Levers, Demandgen, Belkins, Cleverly
**Differentiation:** Apex is embedded, not advisory. They do not deliver strategy documents — they own execution and report on outcomes. Cost-per-result focus vs. cost-per-deliverable.

**Content creators Marcus studies:**
- Alex Hormozi — extreme specificity with numbers, never vague
- Chris Walker — revenue attribution over vanity metrics
- Peep Laja — contrarian takes backed by data

---

## 7. Key Messaging Pillars

1. **Results, not deliverables.** Every Apex engagement ends with documented ROI. If the numbers are not there, the retainer does not renew.
2. **Operators, not consultants.** Marcus and his team have built and operated SaaS businesses. They know what a pipeline problem actually looks like from the inside.
3. **Systems, not campaigns.** B2B growth is not about one great launch. It is about building a repeatable revenue engine that runs without the founder in the loop.
4. **Attribution is non-negotiable.** If you cannot draw a line from content to pipeline to revenue, you are not doing marketing — you are doing activity.

---

## 8. Recommended AI Agent Configuration

**Priority agents:**
1. **Content Agent** — Train on Marcus's LinkedIn posts, newsletter, and case studies. Every draft must match operator-first voice. Auto-generate first drafts for weekly LinkedIn posts and monthly newsletter. No generic frameworks. Real data required in every piece.
2. **Reporting Agent** — Automate monthly client ROI reports. Pull from client data sources, format into Apex template, flag anomalies. This removes 6+ hours/month per client.
3. **Outbound Agent** — Build systematic outbound to qualified ICP. Apollo-based sequences. Train on Marcus's DM style — direct, specific, no fluff. Goal: 10 qualified conversations/month from outbound.
4. **CRM Agent** — Keep HubSpot updated from all client interactions. Flag at-risk clients (no response in 7 days, metrics declining). Weekly pipeline summary to Marcus every Monday.

**Training priority:** Feed all existing client case studies, LinkedIn posts (last 24 months), and newsletter archives first. Voice calibration before any public-facing output.`,
  },
  {
    email: "chris@rawgrowth.ai",
    version: 1,
    status: "approved",
    generated_at: 1775692376197,
    approved_at: 1775692385620,
    content: "Brand profile generation requires an Anthropic API key. Please contact the Rawgrowth team.",
  },
];

async function seed() {
  for (const record of records) {
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id")
      .eq("email", record.email)
      .single();

    if (clientErr || !client) {
      console.log(`Skipping ${record.email} — client not found`);
      continue;
    }

    const { email, ...data } = record;

    const { error } = await supabase.from("brand_profiles").insert({
      client_id: client.id,
      ...data,
    });

    if (error) {
      console.error(`Error inserting for ${record.email}:`, error.message);
    } else {
      console.log(`Inserted brand_profile for ${record.email} (v${record.version})`);
    }
  }

  console.log("Done!");
}

seed();
