import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// Admin resource push is not yet backed by Supabase. This endpoint validates
// the request but does nothing until `resources` + `resource_assignments`
// tables exist in Supabase.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;

    if (!title || !type) {
      return NextResponse.json({ error: "title and type required" }, { status: 400 });
    }

    return NextResponse.json({
      resource: null,
      assignments_created: 0,
      note: "Resources aren't backed by Supabase yet — this endpoint is a no-op.",
    });
  } catch (err: any) {
    console.error("Admin resource push error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
