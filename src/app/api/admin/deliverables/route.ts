import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientId = req.nextUrl.searchParams.get("client_id");
    if (!clientId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }

    const deliverables = await convex.query(api.deliverables.list, {
      clientId: clientId as Id<"clients">,
    });

    return NextResponse.json({ deliverables });
  } catch (err: any) {
    console.error("Admin deliverables fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { client_id, month, week, title, description } = await req.json();

    if (!client_id || !month || !title) {
      return NextResponse.json({ error: "client_id, month, and title required" }, { status: 400 });
    }

    const deliverableId = await convex.mutation(api.deliverables.create, {
      clientId: client_id as Id<"clients">,
      month,
      week: week || 1,
      title,
      description: description || "",
    });

    return NextResponse.json({ deliverable: { _id: deliverableId } });
  } catch (err: any) {
    console.error("Admin deliverable create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, completed } = await req.json();

    if (!id || completed === undefined) {
      return NextResponse.json({ error: "id and completed required" }, { status: 400 });
    }

    await convex.mutation(api.deliverables.toggle, {
      deliverableId: id as Id<"deliverables">,
      completed,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin deliverable toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
