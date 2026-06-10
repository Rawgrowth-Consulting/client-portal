import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        email: { type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        const { data: client } = await supabase
          .from("clients")
          .select("id, email, name, role, company")
          .eq("email", email)
          .single();

        if (!client) return null;

        return {
          id: client.id,
          email: client.email,
          name: client.name,
          role: client.role,
          company: client.company,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.company = (user as any).company;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      (session.user as any).company = token.company;
      return session;
    },
    async authorized({ auth, request }) {
      const { pathname, origin } = request.nextUrl;
      const publicRoutes = ["/login", "/api/auth/", "/api/webhooks/", "/api/rawclaw/"];
      const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
      if (isPublic) return true;

      // Impersonation mutation endpoints enforce their own auth/role and return
      // precise status codes (401/403/400). Defer to the handler instead of
      // redirecting, so non-admins get 403 rather than a 302 bounce.
      const isImpersonationApi =
        pathname.endsWith("/impersonate") || pathname === "/admin/impersonation/exit";
      if (isImpersonationApi) return true;

      const isAdminArea = pathname.startsWith("/admin");
      const isClientArea =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
      const isProtected = isAdminArea || isClientArea;
      if (!isProtected) return true;

      if (!auth) {
        return Response.redirect(new URL("/login", origin));
      }

      const role = auth.user?.role;

      if (isAdminArea && role !== "admin") {
        return Response.redirect(new URL("/dashboard", origin));
      }

      // Admin enters client area only while impersonating. getEffectiveUser
      // revalidates the row and bounces a stale cookie back to /admin.
      if (isClientArea && role === "admin") {
        if (!request.cookies.has("imp_session_id")) {
          return Response.redirect(new URL("/admin", origin));
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
