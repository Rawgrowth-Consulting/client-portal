/**
 * Run with: npx tsx db/005_brand_intakes_seed.ts
 *
 * Seeds the brand_intakes table with existing Convex data.
 * Make sure the brand_intakes table and clients table exist first.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const records = [
  {
    email: "james.oldham0604@gmail.com",
    basic_info: { business_name: "Sentry AI", email: "james.oldham0604@gmail.com", full_name: "James Oldham", phone: "+64 2102899633", timezone: "NZT" },
    social_presence: { focus_platform: "tiktok", instagram: "@james.oldham_", linkedin: "https://linkedin.com.jamesoldham2000", other_platforms: "OnlyFans", paid_ads: "no", top_platform: "TikTok", twitter: "X", website: "https://sentrysolutions.ai", youtube: "dont have" },
    origin_story: { origin: "Just making IG content", proudest: "My growth", unfair_advantage: "not sure" },
    business_model: { monthly_revenue: "$30K-$100K/mo", offer_pricing: "main offer is 3 tiered products", profit_margin: "50%", revenue_breakdown: "20% oganic 80% paid", team_size: "3 fulltime employees", what_you_sell: "Gym Products" },
    target_audience: { audience_hangouts: "subreddits", dream_outcome: "not sure", ideal_client: "old people with money", pain_points: "not sure", why_you: "not sure" },
    goals: { definition_of_winning: "not sure", massive_win: "not sure", revenue_goal_90d: "50K per month", top_metrics: "not sure", twelve_month_vision: "not sure" },
    challenges: { bottleneck: "ewdsxa", top_challenges: "23wqs", tried_solutions: "ewdsx" },
    brand_voice: {},
    competitors: {},
    content_messaging: {},
    sales: {},
    tools_systems: {},
    additional_context: {},
    submitted_at: 1776311550929,
  },
  {
    email: "wyliehawkins99@gmail.com",
    basic_info: { business_name: "All Star Life Group", email: "wyliehawkins99@gmail.com", full_name: "Wylie Hawkins", phone: "9709486022", timezone: "CST" },
    social_presence: { focus_platform: "operations, recruiting and organization", instagram: "@hawkinswylie @allstarlifegroup", linkedin: "https://www.linkedin.com/in/wylie-hawkins-2057b017a/?skipRedirect=true", paid_ads: "No", top_platform: "IG & Youtube", twitter: "n/a", website: "i need a new one but we have allstarlifegroup.com and allstaragentinfo.com", youtube: "@wyliehawkins6539 @AllStarLifeGroup @WylieHawkinsRaw @AllstarAcademyOfficial" },
    origin_story: {
      origin: `I dropped out of college and got started in insurance sales with another company, but it didn't work out. From there, I went all in trying to figure it out on my own—dropshipping, swing trading, building a marketing agency—but nothing stuck. I hit a point where I was lost, uncertain, and genuinely didn't know what direction my life was supposed to go.\n\nFor the first time in my life, I prayed and asked God for a sign—for clarity and direction. He answered that prayer and led me into the insurance group I'm with today.\n\nFrom the start, things took off. I did $18K my first month, $47K my second, and quickly developed into a high-level producer. As the business grew, so did my exposure to new people, and during that time, I met someone who discipled me in my faith. That's when everything started to shift—I truly began to build a relationship with Jesus.\n\nBut I struggled internally. I felt like I had to choose between building a successful business and pursuing God. So I went back and forth—locked in on business at times, then pulled toward faith, never fully aligned. Even though I was able to build a successful business, make significant money, and achieve the lifestyle I once wanted, I still felt unfulfilled.\n\nThat's when God really shifted my perspective. I realized the business itself wasn't the problem—it was my heart posture. I didn't have to separate faith and business. The business could be the vehicle.\n\nSince then, everything has changed. What we're building now goes far beyond income. We're focused on developing men—helping them grow in discipline, leadership, and their relationship with God.\n\nAt the end of the day, I don't just see this as a business anymore—I see it as a mission.`,
      proudest: `Built an agency that produced $94M in volume last year. Created a system where the average agent earns over six figures. Developed 15 individuals who made over $1M in a single year. Personally earning $250,000+ per month. Built enough wealth to live in a $1M home and provide a $500K home for my mom. Helped hundreds of young men get out of debt and gain financial freedom. Built a culture focused on real transformation. Faith-driven impact with majority of the team developing a real relationship with Jesus. Strong focus on fitness, training, and physical development. Many men becoming clean and sober. Built a tight-knit brotherhood. Hosting large-scale events across the country. Building a growing YouTube presence. Turning young men into leaders.`,
      unfair_advantage: `Faith + Fitness + Finances (Integrated, not separate). Brotherhood over "just a sales team". Identity transformation, not just skill training. Speed to results (proof-based system). High-performance culture with clear standards. Leader-led growth. Content + proximity = attraction machine. Community events that deepen buy-in. Sobriety + discipline culture (rare in sales). Leadership development pipeline. Mission-driven (Kingdom-focused).`
    },
    business_model: { monthly_revenue: "$250K+/mo", profit_margin: "", revenue_breakdown: "organic", team_size: "327 guys", what_you_sell: "Life insurance" },
    target_audience: {
      audience_hangouts: "IG, Youtube, influencers",
      dream_outcome: "Make $10K-$30K+ per month with real upside. Break free from income ceilings. Become a disciplined, high-level man. Find real purpose and direction. Build a strong relationship with God. Be part of a winning brotherhood. Achieve financial freedom & lifestyle upgrades. Become a leader others look up to. Build something bigger than themselves.",
      ideal_client: "Age: 18-26 (core focus), up to 30. Male. United States. Blue-collar workers, entry-level sales, college students/dropouts, young men in corporate roles, athletes. Current income $30K-$70K/year. Competitive, driven, wants more out of life. Open to mentorship. Values brotherhood, structure, accountability.",
      pain_points: "Lack of direction & purpose. Income ceiling & financial frustration stuck at $30K-$70K/year. Environment & accountability gap—surrounded by wrong people.",
      why_you: "We develop the man, not just the paycheck. Brotherhood, not a transactional team. Speed to income. Proven track record at scale ($94M volume, 15+ million-dollar earners). Leader-led organization. Clear standards & accountability. Faith-driven mission. Clean, disciplined culture. Content, exposure & opportunity. Leadership pipeline."
    },
    goals: {
      definition_of_winning: "Winning is a man making $15K+/month, walking with Jesus, leading with purpose, and being physically strong and disciplined, that is able to reproduce himself",
      massive_win: "A fully systemized, organized, and scalable infrastructure—training, recruiting, tracking, community, and content—all centralized and running efficiently without constant oversight.",
      revenue_goal_90d: "id like to be at 400k a month",
      top_metrics: "We're focused on improving productivity per rep, increasing the number of reps entering and converting through our pipeline, and scaling our content to drive more inbound growth.",
      twelve_month_vision: "A fully systemized, high-performing organization doing $10M/month, with a $15K/month average rep, elite sales skills across the board, and a streamlined operation that runs efficiently without friction."
    },
    challenges: {
      bottleneck: "organization",
      top_challenges: "Lack of Centralized System (No Single Source of Truth). No Standard Operating Procedures (SOPs). Overall Lack of Organization & Structure.",
      tried_solutions: "nothing really"
    },
    brand_voice: {
      brand_personality: "George Janko (Faith & Relatability). Nick Bare (Discipline & Lifestyle). Patrick Bet-David (Vision & Mentorship).",
      content_formats_enjoy: "all of the above besides written and live streams",
      content_formats_chore: "",
      face_on_camera: "Yes, always",
      tone_avoid: "",
      voice_description: "Welcoming, truth-driven, and community-centered—with a strong foundation in mentorship, wisdom, and sales performance."
    },
    competitors: {},
    content_messaging: {
      core_topics: "Faith (Jesus, purpose, discipleship). Sales & Money ($10K-$30K/month, life insurance). Leadership & Team Building. Fitness & Discipline. Brotherhood & Culture.",
      hot_take: "Most young men don't have an income problem—they have a discipline and environment problem. You don't need more information—you need structure, accountability, and a brotherhood.",
      misconceptions: "Life insurance isn't a scam—it's one of the most lucrative and scalable sales opportunities if done right. You don't need years of experience or a degree to make serious money.",
      one_thing: "We don't just help you make money—we build you into a disciplined, high-earning, faith-driven man surrounded by a brotherhood that actually produces results.",
      posting_frequency: "Instagram: ~2 reels per day (14/week). YouTube: 1-2 long-form videos per week + 1 vlog. Short-form distribution: Heavy clipping strategy across multiple pages.",
      want_more_of: "Long-form YouTube (documentary-style, behind-the-scenes). More testimonials. Faith-driven content. Structured recruiting funnels. Cinematic, high-quality content."
    },
    sales: {
      close_rate: "idk",
      ideal_vs_nightmare: "Ideal = coachable, driven, disciplined, and hungry for growth. Nightmare = lazy, ego-driven, inconsistent, and full of excuses.",
      objections: "not enough candidates",
      sales_process: "content -> DM -> Call -> Close",
      takes_calls: "Yes, I close some -- rest is team"
    },
    tools_systems: {
      ai_comfort: "Beginner -- curious but limited",
      tech_stack: "i just need stuff that is super simple",
      tools_frustrate: ""
    },
    additional_context: {},
    submitted_at: 1775939961804,
  },
  {
    email: "jacksonrapaportffl@gmail.com",
    basic_info: { business_name: "Apex Enterprises Limited Liability Company", email: "jacksonrapaportffl@gmail.com", full_name: "Jackson Paul Rapaport", phone: "9703199739", timezone: "CST" },
    social_presence: { focus_platform: "instagram, linkedin, indeed?", instagram: "@jacksonrapaport", linkedin: "https://www.linkedin.com/in/jacksonrapaport/", other_platforms: "https://www.facebook.com/jackson.rapaport.1/ https://www.tiktok.com/@jacksonrapaport", paid_ads: "not yet", top_platform: "Instagram - by far", twitter: "n/a", website: "n/a", youtube: "https://www.youtube.com/@jacksonrapaport" },
    origin_story: {
      origin: "I have been selling life insurance for about 10 months now. I work under somebody who is extremely successful, doing $12 million a month in revenue, and I do about a quarter million dollars a month in revenue. Over the past 12 months, I've realized that I can be doing a lot more. I went to college at CU Boulder and have a business degree in entrepreneurship. I've worked at just about every single job under the sun—caddy, restaurants, bartending, manual labor, construction, property management, assistant for billionaires, private driving, door knocking—and that led me to life insurance sales because it's the most room for growth and most alignment with my purpose.",
      proudest: "In my business I'm most proud of my personal production, issuing paying about half a million dollars in the first ten months of my business, meaning doing about $500,000 in personal revenue; however I want to teach people and give other people the skills to do the same thing.",
      unfair_advantage: "My unfair advantage is the company culture that I am a part of. I'm a part of a company culture that prioritizes faith, finance, and fitness and it's a trifecta that brings people into a community that gives them the ability to be a part of something that's bigger than themselves."
    },
    business_model: { monthly_revenue: "$10K-$30K/mo", offer_pricing: "I can sell insurance to every single person in the entire US. I hyper-focus on selling whole life and index universal life products. Second revenue stream is overrides from training reps and managing a sales team.", profit_margin: "unknown", revenue_breakdown: "I honestly couldn't even tell you.", team_size: "Anywhere from 20 to 25 people.", what_you_sell: "Life insurance (whole life, final expense, annuity, term, IUL) + overrides from team management." },
    target_audience: {
      audience_hangouts: "Our audience mostly hangs out on Instagram, YouTube, and TikTok",
      dream_outcome: "Their dream outcome is to have extreme financial security, strong community, and locational freedom.",
      ideal_client: "My ideal client is between the ages of 18 and 30 years old. They're coming from a sales industry or blue-collar industry. Location doesn't matter, gender is male.",
      pain_points: "Lack of purpose, lack of community, and lack of financial freedom.",
      why_you: "Competitors only offer the ability to make money. We offer the ability to make money while also transforming their lives with community, faith, and fitness."
    },
    goals: {
      definition_of_winning: "Winning looks like making enough money passively without having to continually sell. Once it is reoccurring revenue, that's when it becomes a business.",
      massive_win: "A massive win in the next 90 days would be team production over $500,000 in a single month. Deposit over $60,000 in a single month. Recruit ten more direct downlines issuing over $15,000 a month.",
      revenue_goal_90d: "Be able to deposit $60k+ in a single month",
      top_metrics: "1. Track actual profitability. 2. Team's production numbers and profitability. 3. Overall issue paid numbers.",
      twelve_month_vision: "In 12 months I want to be doing $3M to $5M in revenue every single month. Average agent issue-paying around $20,000 per month. Established figure in life insurance industry with strong personal brand."
    },
    challenges: {
      bottleneck: "Recruiting at a fast rate and getting new agents paid quickly.",
      top_challenges: "1. Staying organized, tracking profitability. 2. Recruiting and getting new agents paid quickly. 3. Chargeback rates and clients falling off books.",
      tried_solutions: "Virtual assistants in Philippines (didn't work). Boot camps for new agents (not in-depth enough). Need consistent access to real sales training."
    },
    brand_voice: {
      brand_personality: "1. Isn't afraid to say no. 2. Treats their body rigorously. 3. Provider. 4. Protector. 5. Visionary.",
      content_formats_chore: "written, short form sometimes",
      content_formats_enjoy: "Long form, short form, podcasts",
      face_on_camera: "Yes, always",
      favorite_phrases: "Crucify the flesh, starve the dog. Humble yourself.",
      never_say: "n/a",
      tone_avoid: "I avoid being liberal, saying that everyone can have it their way, any tone of entitlement.",
      voice_description: "Welcoming and new age Christian. Someone ready to work like a dog, provide for their family, do whatever it takes. Put the world on their back if that's what is required."
    },
    competitors: {
      admired_brands: "Santa Cruz Medicinals, All Star Life Group",
      business_competitors: "https://www.instagram.com/ifstanwasrich/ https://www.instagram.com/officialjaymaska/",
      content_admire: "I like their strong personal brand and relatability over the camera. They speak about real things. It doesn't feel like they're posting for attention.",
      content_competitors: "higherupwellness, JuulianBecerra, SantaCruzmedicinals",
      how_different: "I'm different because I have a very unique perspective—a deep-rooted Christian who provides for his family, protects people, isn't scared of anything but doesn't walk towards what the world walks towards. Genuinely wants to put people in a position to win and follow the lord.",
      social_competitors: "https://www.youtube.com/@mrfourtoeightbusiness https://www.youtube.com/@higherupwellness https://www.instagram.com/trace.young/"
    },
    content_messaging: {
      best_content: "Lifestyle, finance, and fitness typically perform the best.",
      core_topics: "Faith, finance, and fitness, daily lifestyle",
      hot_take: "We genuinely offer a service to people. Every single person is going to die. Every single person pays taxes. Life insurance helps prevent both from being tragic.",
      misconceptions: "That we are scammers. We're not selling a real product and we only care about the money.",
      one_thing: "I want people to know what our vision is and what our mission is.",
      posting_frequency: "Instagram 7+ times a week. YouTube about once every other week (stopped). TikTok about 5 times a week.",
      want_more_of: "I want to create all of these."
    },
    sales: {
      close_rate: "n/a",
      ideal_vs_nightmare: "Ideal: recently submitted a form requesting life insurance and understands the product. Nightmare: did not request life insurance or has unrealistic expectations.",
      objections: "I don't want to do anything today.",
      sales_process: "Typically it's a call and a one call close.",
      takes_calls: "Yes, I close all deals"
    },
    tools_systems: {
      ai_comfort: "Beginner -- curious but limited",
      tech_stack: "We currently don't have any CRMs, email marketing, scheduling, or anything in place.",
      tools_frustrate: "crappy crms",
      tools_love: "Cold outreach. Once I get the lead sent to my Google Sheet, I directly dial it."
    },
    additional_context: {
      anything_else: "Super excited about working together. I have a lot of ideas and niche business ideas in life insurance plus AI to help my business.",
      convincing_content: "first call",
      how_heard: "Instagram",
      most_excited: "Getting everything organized and actually having a legitimate system built for me.",
      most_nervous: "nothing"
    },
    submitted_at: 1776106973295,
  },
  {
    email: "marcus@apexgrowthagency.com",
    basic_info: { business_name: "Apex Growth Agency", email: "marcus@apexgrowthagency.com", full_name: "Marcus Reid", phone: "+1 (512) 847-3901", timezone: "CST" },
    social_presence: { focus_platform: "Instagram -- build organic authority and short-form video content", instagram: "@apexgrowthagency", linkedin: "https://www.linkedin.com/in/marcus-reid-apex", other_platforms: "TikTok: @apexgrowth, Facebook: Apex Growth Agency", paid_ads: "Yes, Meta ads. $8K/mo budget split between lead gen and retargeting campaigns.", top_platform: "Instagram and LinkedIn drive the most inbound leads", twitter: "@apexgrowth", website: "https://www.apexgrowthagency.com", youtube: "https://www.youtube.com/@alexhormozi" },
    origin_story: {
      origin: "I started Apex Growth Agency after spending 6 years running paid media in-house at two SaaS companies. I kept watching agencies overpromise and underdeliver. In 2020 I went out on my own with one client and a $5K/mo contract. Within 18 months I had 12 clients and a team of 6. The pivot that changed everything was niching down to B2B SaaS companies between $1M and $15M ARR. Today we manage over $2.4M in annual ad spend and have produced documented ROI for every single client we have retained for more than 90 days.",
      proudest: "Building a performance culture where every team member can show their contribution to client revenue. We have a 94% client retention rate over 3 years and zero clients who left saying they did not get ROI.",
      unfair_advantage: "I came up as an operator, not an agency owner. I know what it feels like to be the client getting burned. Every system we build internally gets pressure-tested against what we would have wanted when we were on the other side of the table."
    },
    business_model: { monthly_revenue: "$100K-$250K/mo", offer_pricing: "Core retainer: $5K-$12K/mo. Growth Sprint: $18K one-time for 90-day intensive. Strategy audit: $3K one-time.", profit_margin: "42% net margin after team, tools, and contractors", revenue_breakdown: "55% referrals, 25% cold outbound, 15% organic content, 5% paid", team_size: "9 people: 1 founder, 2 account managers, 3 media buyers, 1 content strategist, 1 ops manager, 1 part-time bookkeeper", what_you_sell: "Paid media management and growth strategy for B2B SaaS companies. We run Meta, Google, and LinkedIn campaigns and build full-funnel content systems alongside them." },
    target_audience: {
      audience_hangouts: "LinkedIn (primary), SaaStr community, Pavilion, Twitter/X tech circles, r/SaaS, YouTube, MicroConf, Lenny's Newsletter audience",
      dream_outcome: "Predictable, documented pipeline growth. CAC under control. A marketing function that can scale without them being in every decision.",
      ideal_client: "Founders and CMOs at B2B SaaS companies, 30-50 years old, $1M-$15M ARR, primarily US-based. Usually Series A or bootstrapped growth stage.",
      pain_points: "1. Paid ads eating budget without predictable pipeline output. 2. Content exists but not converting. 3. Previous agencies burned them with vanity metrics.",
      why_you: "We show our work. Every recommendation comes with data. Clients can see exactly what is performing and why. No black boxes, no account manager runaround."
    },
    goals: {
      definition_of_winning: "Every client gets documented ROI. I can take a 3-week vacation and the business runs cleanly. My team knows exactly what to do and why.",
      massive_win: "Closing 4 new retainers, getting our content engine running without Marcus being the bottleneck, and having AI systems handle first draft of every client report.",
      revenue_goal_90d: "$185K MRR (up from ~$142K). Add 4 net new retainer clients.",
      top_metrics: "1. New MRR added per month. 2. Client churn rate. 3. Hours Marcus spends in reactive vs. proactive work.",
      twelve_month_vision: "$300K MRR, 20 retainer clients, a team that runs without me in the day-to-day."
    },
    challenges: {
      bottleneck: "Marcus's time. Every high-leverage task requires him directly. The business cannot scale past its current ceiling without removing him from the execution layer.",
      top_challenges: "1. Marcus is the bottleneck for all content creation. 2. Client reporting is manual (6+ hours per client per month). 3. No consistent outbound system.",
      tried_solutions: "Hired a content manager (couldn't match voice). Tried Notion AI for reports (too generic). Used a VA for outbound (3 replies in 2 months). Sales coach for 6 months (helped closing but not top of funnel)."
    },
    brand_voice: {
      brand_personality: "The sharp operator who has been in the trenches and earned the right to have opinions. Confident without being arrogant. Generous with real information. Slightly impatient with mediocrity. Deeply loyal to clients.",
      content_formats_chore: "TikTok-style talking head videos. Podcast hosting. Twitter/X threads. Anything requiring daily volume without strategic depth.",
      content_formats_enjoy: "Short-form LinkedIn posts with real numbers. Case study breakdowns. Behind-the-scenes ops content. Occasional long-form essays.",
      face_on_camera: "Sometimes",
      favorite_phrases: "Here is what we did, here is what happened, here is what we would do differently. Operator. Pipeline. Retention. Real talk. Without the fluff.",
      never_say: "Game-changer, revolutionary, disruptive, world-class, guru, secret sauce. Also avoid passive voice.",
      tone_avoid: "Corporate jargon, buzzword-heavy thought leadership. Never say synergize, leverage our core competencies, or move the needle.",
      voice_description: "Direct, no-BS, operator-first. We speak like practitioners, not consultants. We share what works and do not sugarcoat what does not."
    },
    competitors: {
      admired_brands: "Basecamp, Drift (before they sold out), Notion, Y Combinator",
      business_competitors: "https://www.applify.co, https://www.growthlevers.io, https://www.demandgen.com, https://www.belkins.io, https://www.cleverly.co",
      content_admire: "Hormozi: extreme specificity with numbers. Walker: kills vanity metrics. Laja: contrarian takes backed by data.",
      content_competitors: "Alex Hormozi (acquisition.com), Chris Walker (refine labs), Peep Laja (wynter.com)",
      how_different: "We are embedded operators, not strategy consultants. We sit inside our clients' businesses, not above them. We measure success by revenue impact, not deliverables.",
      social_competitors: "https://www.linkedin.com/in/alexhormozi/, https://www.linkedin.com/in/sam-jacobs-2161b022/, https://www.linkedin.com/in/jasonlemkin/"
    },
    content_messaging: {
      best_content: "https://www.linkedin.com/posts/marcusreid_how-we-added-38k-mrr-in-90-days, https://apexgrowthagency.com/blog/b2b-saas-pipeline-playbook",
      core_topics: "1. B2B SaaS growth strategy. 2. Agency operations. 3. Real case studies with attribution data. 4. Hiring and team building. 5. Gap between marketing activity and revenue impact.",
      hot_take: "Most B2B agencies are selling strategy when their clients need execution. The market is drowning in frameworks and starving for operators.",
      misconceptions: "That B2B growth requires a massive team and massive budget. Most companies are over-staffed and under-systematized.",
      one_thing: "We do not do marketing. We build growth systems. Every engagement ends with documented ROI or we do not renew.",
      posting_frequency: "LinkedIn: 2/week. Newsletter: 2x/month. YouTube: 0 currently. Blog: sporadic (1/quarter).",
      want_more_of: "Deep-dive case studies with real numbers. Client story content. Short-form posts challenging conventional growth thinking. Newsletter issues that read like internal memos."
    },
    sales: {
      close_rate: "58%",
      ideal_vs_nightmare: "Ideal: B2B SaaS, $3M-$15M ARR, founder who has been operator. Nightmare: expects overnight results, 5 layers of approval, treats us as vendor not partner.",
      objections: "Price. We already have an internal team. Timing. Skepticism about our approach for their vertical.",
      sales_process: "LinkedIn content drives inbound DMs. 20-minute discovery call. Case study + audit doc. 45-minute strategy call. Close on second call or async via Loom.",
      takes_calls: "Yes, I close all deals"
    },
    tools_systems: {
      ai_comfort: "Intermediate -- experimented",
      tech_stack: "CRM: HubSpot. Email: ActiveCampaign. Scheduling: Calendly. Payments: Stripe. PM: Notion + Linear. Content: Figma, Descript, Loom. Analytics: GA4, Hotjar, Databox. Outreach: Apollo.io.",
      tools_frustrate: "HubSpot (overbuilt), ActiveCampaign (UI nightmare), GA4 (reports require data analyst).",
      tools_love: "Notion, Loom, Apollo, Descript."
    },
    additional_context: {
      anything_else: "Best communication is async by default, sync when it matters. Send Looms or Notion docs over long email threads. I process information best in writing.",
      convincing_content: "https://www.linkedin.com/posts/chriswestrawgrowth_ai-department-case-study",
      how_heard: "Referral",
      most_excited: "Getting the content engine off my plate. Also excited to see what an AI system can actually do with our data.",
      most_nervous: "That the AI output will not sound like us. Also nervous about the transition period."
    },
    submitted_at: 1775813755454,
  },
  {
    email: "dilan@rawgrowth.ai",
    basic_info: {},
    social_presence: {},
    origin_story: {},
    business_model: {},
    target_audience: {},
    goals: {},
    challenges: {},
    brand_voice: {},
    competitors: {},
    content_messaging: {},
    sales: {},
    tools_systems: {},
    additional_context: {},
    submitted_at: null,
  },
  {
    email: "chris@rawgrowth.ai",
    basic_info: {},
    social_presence: {},
    origin_story: {},
    business_model: {},
    target_audience: {},
    goals: {},
    challenges: {},
    brand_voice: {},
    competitors: {},
    content_messaging: {},
    sales: {},
    tools_systems: {},
    additional_context: {},
    submitted_at: 1775692376197,
  },
];

async function seed() {
  for (const record of records) {
    // Look up client_id by email
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

    const { error } = await supabase
      .from("brand_intakes")
      .upsert({ client_id: client.id, ...data }, { onConflict: "client_id" });

    if (error) {
      console.error(`Error inserting for ${record.email}:`, error.message);
    } else {
      console.log(`Inserted brand_intake for ${record.email}`);
    }
  }

  console.log("Done!");
}

seed();
