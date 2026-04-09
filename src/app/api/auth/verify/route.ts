import { NextRequest, NextResponse } from "next/server";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // Find magic link
    const magicLink = await convex.query(api.magicLinks.verify, { token });

    if (!magicLink) {
      return NextResponse.json({ error: "Invalid or used link" }, { status: 401 });
    }

    if (magicLink.used) {
      return NextResponse.json({ error: "Link already used" }, { status: 401 });
    }

    if (magicLink.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 401 });
    }

    // Mark as used
    await convex.mutation(api.magicLinks.markUsed, { id: magicLink._id });

    // Find client by email
    const client = await convex.query(api.clients.getByEmail, { email: magicLink.email });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine redirect
    let redirectUrl = "/dashboard";
    if (client.role === "admin") {
      redirectUrl = "/admin";
    } else if (!client.onboardingCompletedAt) {
      const step = client.onboardingStep || 1;
      const steps: Record<number, string> = {
        1: "1-welcome", 2: "2-questionnaire", 3: "3-brand-profile",
        4: "4-brand-docs", 5: "5-api-keys", 6: "6-software-access",
        7: "7-schedule-calls", 8: "8-complete",
      };
      redirectUrl = `/onboarding/${steps[step] || "1-welcome"}`;
    }

    const response = NextResponse.json({ success: true, redirect: redirectUrl });

    // Store client identity in cookie
    response.cookies.set("convex_auth", JSON.stringify({
      token,
      model: {
        id: client._id,
        email: client.email,
        name: client.name,
        role: client.role,
      },
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
