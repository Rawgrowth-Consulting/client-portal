import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// Resources are not yet backed by a Supabase table. This endpoint returns
// an empty list so the dashboard renders cleanly. Wire up Supabase queries
// here once the `resources` + `resource_assignments` schema exists.
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ resources: [] });
  } catch (err: any) {
    console.error("Resources fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
