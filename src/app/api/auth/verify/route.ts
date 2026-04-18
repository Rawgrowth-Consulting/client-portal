import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // Find magic link
    const { data: magicLink } = await supabase
      .from("magic_links")
      .select("*")
      .eq("token", token)
      .single();

    if (!magicLink) {
      return NextResponse.json({ error: "Invalid or used link" }, { status: 401 });
    }

    if (magicLink.used) {
      return NextResponse.json({ error: "Link already used" }, { status: 401 });
    }

    if (magicLink.expires_at < Date.now()) {
      return NextResponse.json({ error: "Link expired" }, { status: 401 });
    }

    // Mark as used
    await supabase
      .from("magic_links")
      .update({ used: true })
      .eq("id", magicLink.id);

    // Find client by email
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("email", magicLink.email)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine redirect
    let redirectUrl = "/dashboard";
    if (client.role === "admin") {
      redirectUrl = "/admin";
    } else if (client.status !== "active") {
      redirectUrl = "/onboarding";
    }

    // Return email so the client can create a next-auth session
    return NextResponse.json({
      success: true,
      redirect: redirectUrl,
      email: magicLink.email,
    });
  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
