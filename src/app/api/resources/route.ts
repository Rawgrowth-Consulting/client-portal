import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await convex.query(api.resources.listForClient, {
      clientId: user.id as Id<"clients">,
    });

    return NextResponse.json({ resources });
  } catch (err: any) {
    console.error("Resources fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
