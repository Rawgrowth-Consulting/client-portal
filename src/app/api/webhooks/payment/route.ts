import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMagicLinkEmail } from "@/lib/resend";
import { sendSlackMessage } from "@/lib/slack";
import crypto from "crypto";

const CALENDLY_URL = "https://calendly.com/chriswestt/rawgrowth-discovery";

// Placeholder scheduled calls seeded on new client creation. The team fills
// in `scheduled_at` as each one gets booked (kickoff goes through the
// onboarding chat; the rest are scheduled by ops later).
const DEFAULT_CALLS = [
  { title: "Week 1 Kickoff", month: 1, week: 1 },
  { title: "Month 2 Kickoff", month: 2, week: 5 },
  { title: "Month 3 Kickoff", month: 3, week: 9 },
  { title: "Month 4 Review & Growth Plan", month: 4, week: 13 },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract from Stripe or n8n webhook payload
    const email: string | undefined =
      body.email || body.customer_email || body.data?.object?.customer_email;
    const name: string =
      body.name || body.customer_name || body.data?.object?.customer_name || "";
    const company: string = body.company || body.metadata?.company || "";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find or create the client
    let { data: client } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!client) {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("clients")
        .insert({
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          company: company || "",
          role: "client",
          status: "onboarding",
          current_month: 1,
          health_score: 0,
          onboarding_step: 1,
        })
        .select("*")
        .single();

      if (insertErr) {
        console.error("[payment-webhook] client insert failed:", insertErr);
        return NextResponse.json(
          { error: insertErr.message },
          { status: 500 }
        );
      }
      client = inserted;
    }

    if (!client) {
      return NextResponse.json(
        { error: "Failed to create client" },
        { status: 500 }
      );
    }

    // 2. Create a magic link valid for 7 days
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await supabaseAdmin.from("magic_links").insert({
      email: normalizedEmail,
      token,
      expires_at: expiresAt,
      used: false,
    });

    const result = await sendMagicLinkEmail(normalizedEmail, token);

    // 3. Seed placeholder scheduled calls (skip any that already exist for this client)
    const { data: existingCalls } = await supabaseAdmin
      .from("scheduled_calls")
      .select("month, week")
      .eq("client_id", client.id);
    const existingKeys = new Set(
      (existingCalls || []).map((c: any) => `${c.month}:${c.week}`)
    );

    const toInsert = DEFAULT_CALLS.filter(
      (c) => !existingKeys.has(`${c.month}:${c.week}`)
    ).map((c) => ({
      client_id: client!.id,
      title: c.title,
      month: c.month,
      week: c.week,
      calendly_url: CALENDLY_URL,
      completed: false,
    }));

    if (toInsert.length) {
      await supabaseAdmin.from("scheduled_calls").insert(toInsert);
    }

    // 4. Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(
        slackChannel,
        `New client payment received: ${name || "Unknown"} (${normalizedEmail})${company ? " - " + company : ""}\nMagic link sent. Portal: portal.rawgrowth.ai/admin`
      );
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      ...(result && "link" in result ? { debug_link: result.link } : {}),
    });
  } catch (err: any) {
    console.error("Payment webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
