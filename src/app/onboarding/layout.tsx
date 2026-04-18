import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060B08]">
      {children}
    </div>
  );
}
