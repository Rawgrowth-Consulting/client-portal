import { signOut } from "@/lib/auth-config";

export async function POST() {
  await signOut({ redirect: false });
  return Response.json({ success: true });
}

export async function GET() {
  await signOut({ redirectTo: "/login" });
}
