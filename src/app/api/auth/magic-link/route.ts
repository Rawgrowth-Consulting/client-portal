import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendMagicLinkEmail } from "@/lib/resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check if client exists with this email
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old unused tokens for this email
    await supabase.from("magic_links").delete().eq("email", email);

    // Store magic link in Supabase
    const { error: insertErr } = await supabase
      .from("magic_links")
      .insert({ email, token, expires_at: expiresAt });

    if (insertErr) throw insertErr;

    // In development, log the login link to the console so we can bypass email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginLink = `${baseUrl}/login/verify?token=${token}`;

    if (process.env.NODE_ENV === "development") {
      console.log("\n========== MAGIC LOGIN LINK ==========");
      console.log(loginLink);
      console.log("=======================================\n");
    }

    // Send email (may fail in dev if domain not verified)
    try {
      await sendMagicLinkEmail(email, token);
    } catch (emailErr) {
      console.warn("Email sending failed (using console link instead):", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Magic link error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
