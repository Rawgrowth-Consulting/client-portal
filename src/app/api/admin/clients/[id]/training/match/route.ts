import { NextResponse } from "next/server";
import { requireAdminId } from "@/lib/admin-auth";
import { matchTrainingForClient } from "@/lib/training/match";

// FC-04/07: admin triggers training match for a client. Empty match returns a
// flag so the UI can show the "no matches; review tags" CTA.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdminId();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const result = await matchTrainingForClient(id, adminId);
  return NextResponse.json(result);
}
