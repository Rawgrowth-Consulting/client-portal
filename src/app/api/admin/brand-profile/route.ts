import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const clientId = req.nextUrl.searchParams.get("client_id");
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const { data: profiles } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("client_id", clientId)
      .order("version", { ascending: false });

    const current = profiles?.[0] || null;

    return NextResponse.json({ current, versions: profiles || [] });
  } catch (err: any) {
    console.error("Admin brand profile fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { profileId, clientId, client_id, content, action, status } = await req.json();
    const resolvedClientId = clientId || client_id;

    if (!resolvedClientId || !content) {
      return NextResponse.json({ error: "clientId and content required" }, { status: 400 });
    }

    let resolvedStatus: string = status || "ready";
    if (action === "approve") resolvedStatus = "approved";

    if (profileId) {
      // Update existing profile
      const updateData: Record<string, any> = { content, status: resolvedStatus };
      if (resolvedStatus === "approved") {
        updateData.approved_at = Date.now();
        updateData.approved_by = user.id;
      }
      await supabase.from("brand_profiles").update(updateData).eq("id", profileId);
    } else {
      // Create new version
      const { data: latest } = await supabase
        .from("brand_profiles")
        .select("version")
        .eq("client_id", resolvedClientId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (latest?.version || 0) + 1;

      await supabase.from("brand_profiles").insert({
        client_id: resolvedClientId,
        version: nextVersion,
        content,
        status: resolvedStatus,
        generated_at: Date.now(),
        ...(resolvedStatus === "approved" ? { approved_at: Date.now(), approved_by: user.id } : {}),
      });
    }

    const { data: profile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("client_id", resolvedClientId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Admin brand profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { client_id, content, status } = await req.json();
    if (!client_id || !content) {
      return NextResponse.json({ error: "client_id and content required" }, { status: 400 });
    }

    const { data: latest } = await supabase
      .from("brand_profiles")
      .select("version")
      .eq("client_id", client_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latest?.version || 0) + 1;

    await supabase.from("brand_profiles").insert({
      client_id,
      version: nextVersion,
      content,
      status: status || "ready",
      generated_at: Date.now(),
    });

    const { data: profile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("client_id", client_id)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Admin brand profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
