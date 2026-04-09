import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendMagicLinkEmail } from "@/lib/resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check if client exists with this email
    const client = await convex.query(api.clients.getByEmail, { email });

    if (!client) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store magic link in Convex
    await convex.mutation(api.magicLinks.create, { email, token, expiresAt });

    // Send email
    const result = await sendMagicLinkEmail(email, token);

    return NextResponse.json({
      success: true,
      ...(result && "link" in result && !process.env.RESEND_API_KEY ? { debug_link: result.link } : {}),
    });
  } catch (err: any) {
    console.error("Magic link error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
