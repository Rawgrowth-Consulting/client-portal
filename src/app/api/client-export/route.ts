import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * GET /api/client-export
 *
 * Used by Rawclaw's `npm run portal-sync` to pull client config and populate
 * knowledge/client/ files automatically.
 *
 * Auth: Authorization: Bearer <clientId>
 * The token is the client's Convex _id (same token as /api/rawclaw/generate-token).
 *
 * Returns: PortalClientConfig (matches portal-sync.ts interface)
 */
export async function GET(req: NextRequest) {
  // Auth -- Bearer token is client's Convex _id
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();

  // Look up client
  let client: any;
  try {
    client = await convex.query(api.clients.get, {
      clientId: token as Id<"clients">,
    });
  } catch {
    // Invalid ID format
  }

  if (!client) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  // Pull intake data
  const intake = await convex.query(api.brandIntake.get, {
    clientId: client._id,
  });

  // Map to PortalClientConfig
  const config = buildClientConfig(client, intake);

  return NextResponse.json(config);
}

function buildClientConfig(client: any, intake: any): Record<string, any> {
  const basic = intake?.basicInfo || {};
  const social = intake?.socialPresence || {};
  const business = intake?.businessModel || {};
  const audience = intake?.targetAudience || {};
  const goals = intake?.goals || {};
  const challenges = intake?.challenges || {};
  const voice = intake?.brandVoice || {};
  const competitorData = intake?.competitors || {};
  const salesData = intake?.sales || {};
  const messaging = intake?.contentMessaging || {};
  const additional = intake?.additionalContext || {};

  // --- Company ---
  const companyName = client.company || "";
  const website =
    basic.website ||
    social.website ||
    social.primary_website ||
    "";

  // --- Description ---
  const description =
    business.one_line_description ||
    business.what_you_do ||
    business.description ||
    messaging.primary_message ||
    `${companyName} offers professional services to their clients.`;

  // --- ICP ---
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

  // --- Transformation ---
  const transformation =
    goals.client_transformation ||
    goals.outcome ||
    goals.primary_goal ||
    business.transformation ||
    messaging.transformation ||
    `Clients work with ${companyName} to achieve measurable results in their business.`;

  // --- Offer ---
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

  // Phases -- try structured or fallback to text
  const rawPhases =
    business.phases ||
    business.process_phases ||
    salesData.phases ||
    null;

  let phases: Array<{ name: string; duration: string; description: string }> | undefined;
  if (Array.isArray(rawPhases) && rawPhases.length > 0) {
    phases = rawPhases.map((p: any) => ({
      name: p.name || p.phase || "Phase",
      duration: p.duration || p.timeline || "",
      description: p.description || p.details || "",
    }));
  } else if (typeof rawPhases === "string" && rawPhases.trim()) {
    // Single text blob -- wrap as one phase
    phases = [{ name: "Core Process", duration: "", description: rawPhases }];
  }

  // Objections
  const rawObjections =
    salesData.objections ||
    salesData.common_objections ||
    business.objections ||
    null;

  let objections: Array<{ question: string; answer: string }> | undefined;
  if (Array.isArray(rawObjections) && rawObjections.length > 0) {
    objections = rawObjections.map((o: any) => ({
      question: o.question || o.objection || o.q || "",
      answer: o.answer || o.response || o.a || "",
    }));
  }

  // --- Brand Voice ---
  const tone =
    voice.tone ||
    voice.personality ||
    voice.voice_description ||
    voice.writing_style ||
    "Professional, direct, and results-focused.";

  const wordsToUse: string[] | undefined = parseStringList(
    voice.words_to_use || voice.power_words || voice.preferred_words
  );

  const wordsToAvoid: string[] | undefined = parseStringList(
    voice.words_to_avoid || voice.avoid_words || voice.banned_words
  );

  const styleNotes =
    voice.style_notes ||
    voice.guidelines ||
    voice.additional_notes ||
    undefined;

  // --- Team ---
  const team: Array<{ name: string; role: string; contact?: string; authority?: string }> = [
    {
      name: client.name,
      role: basic.your_role || basic.title || "Owner",
      contact: client.email,
      authority: "Final approval on all outbound communications and strategic decisions.",
    },
  ];

  // Additional team from intake
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

  // --- Competitors ---
  const competitors: Array<{ name: string; website?: string; notes?: string }> = [];
  const rawComps =
    competitorData.competitors ||
    competitorData.main_competitors ||
    competitorData.list ||
    null;

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
    // Comma or newline separated
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
