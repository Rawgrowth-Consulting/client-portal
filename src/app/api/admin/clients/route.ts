import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clients = await convex.query(api.clients.listAll, {});

    return NextResponse.json({ clients });
  } catch (err: any) {
    console.error("Admin clients error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
