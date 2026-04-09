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

    const profile = await convex.query(api.brandProfile.get, {
      clientId: clientId as Id<"clients">,
    });

    return NextResponse.json({
      current: profile,
      versions: profile ? [profile] : [],
    });
  } catch (err: any) {
    console.error("Admin brand profile fetch error:", err);
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

    const { profileId, clientId, client_id, content, action, status } = await req.json();
    const resolvedClientId = (clientId || client_id) as Id<"clients">;

    if (!resolvedClientId || !content) {
      return NextResponse.json({ error: "clientId and content required" }, { status: 400 });
    }

    let resolvedStatus: "generating" | "ready" | "approved" = status || "ready";
    if (action === "approve") resolvedStatus = "approved";

    if (profileId) {
      await convex.mutation(api.brandProfile.updateContent, {
        profileId: profileId as Id<"brandProfiles">,
        content,
        status: resolvedStatus,
      });
      if (resolvedStatus === "approved") {
        await convex.mutation(api.brandProfile.approve, {
          profileId: profileId as Id<"brandProfiles">,
          approvedBy: user.id,
        });
      }
    } else {
      // Create new version via regenerate + update
      const newProfileId = await convex.mutation(api.brandProfile.regenerate, {
        clientId: resolvedClientId,
        feedback: content,
      });
      await convex.mutation(api.brandProfile.updateContent, {
        profileId: newProfileId as Id<"brandProfiles">,
        content,
        status: resolvedStatus,
      });
    }

    const profile = await convex.query(api.brandProfile.get, { clientId: resolvedClientId });
    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Admin brand profile update error:", err);
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

    const { client_id, content, status } = await req.json();

    if (!client_id || !content) {
      return NextResponse.json({ error: "client_id and content required" }, { status: 400 });
    }

    const newProfileId = await convex.mutation(api.brandProfile.regenerate, {
      clientId: client_id as Id<"clients">,
      feedback: "",
    });

    await convex.mutation(api.brandProfile.updateContent, {
      profileId: newProfileId as Id<"brandProfiles">,
      content,
      status: (status || "ready") as "generating" | "ready" | "approved",
    });

    const profile = await convex.query(api.brandProfile.get, {
      clientId: client_id as Id<"clients">,
    });

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Admin brand profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
