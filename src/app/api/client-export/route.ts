import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

/**
 * GET /api/client-export
 *
 * Used by Rawclaw's `npm run portal-sync` to pull client config and populate
 * knowledge/client/ files automatically.
 *
 * Auth: Authorization: Bearer <clientId>
 *
 * Returns: PortalClientConfig (matches portal-sync.ts interface)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();

  // Look up client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", token)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  // Pull intake data
  const { data: intake } = await supabase
    .from("brand_intakes")
    .select("*")
    .eq("client_id", client.id)
    .single();

  const config = buildClientConfig(client, intake);

  return NextResponse.json(config);
}

function buildClientConfig(client: any, intake: any): Record<string, any> {
  const basic = intake?.basic_info || {};
  const social = intake?.social_presence || {};
  const business = intake?.business_model || {};
  const audience = intake?.target_audience || {};
  const goals = intake?.goals || {};
  const challenges = intake?.challenges || {};
  const voice = intake?.brand_voice || {};
  const competitorData = intake?.competitors || {};
  const salesData = intake?.sales || {};
  const messaging = intake?.content_messaging || {};
  const additional = intake?.additional_context || {};

  const companyName = client.company || "";
  const website = basic.website || social.website || social.primary_website || "";

  const description =
    business.one_line_description ||
    business.what_you_do ||
    business.description ||
    messaging.primary_message ||
    `${companyName} offers professional services to their clients.`;

  const icpParts: string[] = [];
  if (audience.ideal_client_title || audience.job_title) {
    icpParts.push(`**Who:** ${audience.ideal_client_title || audience.job_title}`);
  }
  if (audience.company_size || audience.business_size) {
    icpParts.push(`**Company size:** ${audience.company_size || audience.business_size}`);
  }
  if (audience.revenue || audience.annual_revenue) {
    icpParts.push(`**Revenue:** ${audience.revenue || audience.annual_revenue}`);
  }
  if (audience.industry || basic.industry) {
    icpParts.push(`**Industry:** ${audience.industry || basic.industry}`);
  }
  if (audience.pain_points || challenges.main_challenges) {
    icpParts.push(`**Pain points:** ${audience.pain_points || challenges.main_challenges}`);
  }
  if (audience.goals || audience.desired_outcome) {
    icpParts.push(`**Goals:** ${audience.goals || audience.desired_outcome}`);
  }
  if (audience.demographics || audience.description) {
    icpParts.push(audience.demographics || audience.description);
  }
  const icp = icpParts.length
    ? icpParts.join("\n")
    : audience.notes || "See business profile for ICP details.";

  const transformation =
    goals.client_transformation ||
    goals.outcome ||
    goals.primary_goal ||
    business.transformation ||
    messaging.transformation ||
    `Clients work with ${companyName} to achieve measurable results in their business.`;

  const offerName =
    business.main_offer ||
    business.product_name ||
    business.service_name ||
    salesData.main_offer ||
    `${companyName} Core Program`;

  const offerPrice =
    business.price ||
    business.pricing ||
    salesData.price ||
    salesData.pricing ||
    "Custom pricing";

  const guarantee =
    business.guarantee ||
    salesData.guarantee ||
    "Results guaranteed or we work until you get them.";

  const rawPhases = business.phases || business.process_phases || salesData.phases || null;
  let phases: Array<{ name: string; duration: string; description: string }> | undefined;
  if (Array.isArray(rawPhases) && rawPhases.length > 0) {
    phases = rawPhases.map((p: any) => ({
      name: p.name || p.phase || "Phase",
      duration: p.duration || p.timeline || "",
      description: p.description || p.details || "",
    }));
  } else if (typeof rawPhases === "string" && rawPhases.trim()) {
    phases = [{ name: "Core Process", duration: "", description: rawPhases }];
  }

  const rawObjections = salesData.objections || salesData.common_objections || business.objections || null;
  let objections: Array<{ question: string; answer: string }> | undefined;
  if (Array.isArray(rawObjections) && rawObjections.length > 0) {
    objections = rawObjections.map((o: any) => ({
      question: o.question || o.objection || o.q || "",
      answer: o.answer || o.response || o.a || "",
    }));
  }

  const tone =
    voice.tone || voice.personality || voice.voice_description || voice.writing_style ||
    "Professional, direct, and results-focused.";

  const wordsToUse: string[] | undefined = parseStringList(voice.words_to_use || voice.power_words || voice.preferred_words);
  const wordsToAvoid: string[] | undefined = parseStringList(voice.words_to_avoid || voice.avoid_words || voice.banned_words);
  const styleNotes = voice.style_notes || voice.guidelines || voice.additional_notes || undefined;

  const team: Array<{ name: string; role: string; contact?: string; authority?: string }> = [
    {
      name: client.name,
      role: basic.your_role || basic.title || "Owner",
      contact: client.email,
      authority: "Final approval on all outbound communications and strategic decisions.",
    },
  ];

  const rawTeam = additional.team_members || additional.team || [];
  if (Array.isArray(rawTeam)) {
    for (const m of rawTeam) {
      team.push({
        name: m.name || "",
        role: m.role || m.title || "",
        contact: m.contact || m.email || undefined,
        authority: m.authority || undefined,
      });
    }
  }

  const competitors: Array<{ name: string; website?: string; notes?: string }> = [];
  const rawComps = competitorData.competitors || competitorData.main_competitors || competitorData.list || null;

  if (Array.isArray(rawComps)) {
    for (const c of rawComps) {
      if (typeof c === "string") {
        competitors.push({ name: c });
      } else if (c?.name) {
        competitors.push({
          name: c.name,
          website: c.website || c.url || undefined,
          notes: c.notes || c.description || undefined,
        });
      }
    }
  } else if (typeof rawComps === "string" && rawComps.trim()) {
    for (const name of rawComps.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean)) {
      competitors.push({ name });
    }
  }

  return {
    companyName,
    website,
    description,
    icp,
    transformation,
    offer: {
      name: offerName,
      price: offerPrice,
      guarantee,
      ...(phases ? { phases } : {}),
      ...(objections ? { objections } : {}),
    },
    brandVoice: {
      tone,
      ...(wordsToUse?.length ? { wordsToUse } : {}),
      ...(wordsToAvoid?.length ? { wordsToAvoid } : {}),
      ...(styleNotes ? { styleNotes } : {}),
    },
    team,
    ...(competitors.length ? { competitors } : {}),
    updatedAt: new Date().toISOString(),
  };
}

function parseStringList(val: unknown): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val.filter((s) => typeof s === "string" && s.trim());
  if (typeof val === "string" && val.trim()) {
    return val.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}
