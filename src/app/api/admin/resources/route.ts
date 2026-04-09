import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { convex } from "@/lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import { sendSlackMessage } from "@/lib/slack";
import type { Id } from "../../../../../convex/_generated/dataModel";

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
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const externalUrl = formData.get("external_url") as string;
    const targetAll = formData.get("target_all") === "true";
    const clientIdsRaw = formData.get("client_ids") as string;

    if (!title || !type) {
      return NextResponse.json({ error: "title and type required" }, { status: 400 });
    }

    // Create resource record in Convex
    const resourceId = await convex.mutation(api.resources.create, {
      title,
      description: description || "",
      type: type as "skill" | "update" | "doc" | "tool",
      externalUrl: externalUrl || undefined,
      pushedBy: user.email,
      targetAll,
    });

    // Determine target clients
    let targetClientIds: Id<"clients">[] = [];

    if (targetAll) {
      const allClients = await convex.query(api.clients.listAll, {});
      targetClientIds = allClients
        .filter((c) => c.status === "active")
        .map((c) => c._id);
    } else if (clientIdsRaw) {
      const parsed: string[] = JSON.parse(clientIdsRaw);
      targetClientIds = parsed as Id<"clients">[];
    }

    // Create assignments and notify via Slack
    for (const clientId of targetClientIds) {
      await convex.mutation(api.resources.assign, {
        resourceId,
        clientId,
      });

      const client = await convex.query(api.clients.get, { clientId });
      if (client?.slackChannelId) {
        await sendSlackMessage(
          client.slackChannelId,
          `New resource available: ${title}${description ? " -- " + description : ""}`
        );
      }
    }

    return NextResponse.json({
      resource: { _id: resourceId },
      assignments_created: targetClientIds.length,
    });
  } catch (err: any) {
    console.error("Admin resource push error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
