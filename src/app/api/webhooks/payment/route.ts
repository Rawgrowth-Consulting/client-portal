import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendMagicLinkEmail } from "@/lib/resend";
import { sendSlackMessage } from "@/lib/slack";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract from Stripe or n8n webhook payload
    const email = body.email || body.customer_email || body.data?.object?.customer_email;
    const name = body.name || body.customer_name || body.data?.object?.customer_name || "";
    const company = body.company || body.metadata?.company || "";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if client already exists
    let client = await convex.query(api.clients.getByEmail, { email });

    if (!client) {
      // Create new client record
      const clientId = await convex.mutation(api.clients.create, {
        email,
        name: name || email.split("@")[0],
        company: company || "",
        password: crypto.randomBytes(16).toString("hex"), // placeholder, not used
      });

      client = await convex.query(api.clients.get, { clientId });
    }

    if (!client) {
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days for initial access

    await convex.mutation(api.magicLinks.create, { email, token, expiresAt });

    // Send magic link email
    const result = await sendMagicLinkEmail(email, token);

    // Create default scheduled calls
    const defaultCalls = [
      { title: "Week 1 Kickoff", month: 1, week: 1 },
      { title: "Month 2 Kickoff", month: 2, week: 5 },
      { title: "Month 3 Kickoff", month: 3, week: 9 },
      { title: "Month 4 Review & Growth Plan", month: 4, week: 13 },
    ];

    for (const call of defaultCalls) {
      try {
        await convex.mutation(api.scheduledCalls.schedule, {
          clientId: client._id,
          title: call.title,
          month: call.month,
          week: call.week,
          calendlyUrl: "https://calendly.com/chriswestt/rawgrowth-discovery",
        });
      } catch {}
    }

    // Notify Slack
    const slackChannel = process.env.SLACK_TEAM_CHANNEL;
    if (slackChannel) {
      await sendSlackMessage(
        slackChannel,
        `New client payment received: ${name} (${email}) - ${company}\nMagic link sent. Portal: portal.rawgrowth.ai/admin`
      );
    }

    return NextResponse.json({
      success: true,
      clientId: client._id,
      ...(result && "link" in result ? { debug_link: result.link } : {}),
    });
  } catch (err: any) {
    console.error("Payment webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
