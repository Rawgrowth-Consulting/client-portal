import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// Resource "seen" tracking is not yet backed by Supabase. This endpoint
// accepts the request so callers don't break, but is a no-op until the
// `resource_assignments` schema exists in Supabase.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignment_id } = await req.json();
    if (!assignment_id) {
      return NextResponse.json({ error: "Missing assignment_id" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
