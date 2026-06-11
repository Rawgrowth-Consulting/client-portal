import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildPacket } from "@/lib/deploy-packet/build-packet";

// FC-01: returns the deployment packet JSON. FC-02: flips deployment_status +
// best-effort audit. FC-03: 409 if docs unapproved. FC-04: optional webhook.
// FC-09: admin-only (403 non-admin).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAuthUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: actorClient } = await supabaseAdmin
    .from("clients")
    .select("role")
    .eq("id", actor.id)
    .maybeSingle();
  if (actorClient?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: clientId } = await params;
  const result = await buildPacket(clientId);
  if (!result.ok) return NextResponse.json(result.body, { status: result.status });

  const packet: Record<string, any> = { ...result.packet, generated_at: new Date().toISOString() };

  // FC-02: mark deployment_status packet_ready (best-effort — the column is
  // optional until its migration lands) + best-effort audit row.
  const flip = await supabaseAdmin
    .from("clients")
    .update({ deployment_status: "packet_ready" })
    .eq("id", clientId);
  if (flip.error) packet.warnings.push("deployment_status not persisted (column missing)");
  try {
    await supabaseAdmin.from("hq_audit_log").insert({
      action: "deployment_packet_generated",
      client_id: clientId,
      actor: actor.id,
    });
  } catch {
    // hq_audit_log may not exist in this tenant; audit is non-fatal.
  }

  // FC-04: optional provisioning webhook. Failure never blocks the download.
  const hookUrl = process.env.RAWCLAW_PROVISION_WEBHOOK_URL;
  if (hookUrl) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(hookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RAWCLAW_PROVISION_TOKEN ?? ""}`,
        },
        body: JSON.stringify(packet),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) packet.warnings.push(`provision webhook returned ${res.status}`);
    } catch {
      packet.warnings.push("provision webhook failed (logged, not blocking)");
    }
  }

  return NextResponse.json(packet);
}
