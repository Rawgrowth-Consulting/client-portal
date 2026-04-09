import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = user.id as Id<"clients">;

    // Generate upload URL from Convex storage
    const uploadUrl = await convex.mutation(api.documents.generateUploadUrl, {});

    return NextResponse.json({ uploadUrl, clientId });
  } catch (err: any) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
